// Package projectfiles exports the explicitly declared Compose inputs without
// resolving interpolation, credentials, or host files referenced by the project.
package projectfiles

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"regexp"
	"sort"
	"strings"
	"time"
)

const maxBytes = 16 << 20
const ManifestName = "vessel-project.json"

var interpolation = regexp.MustCompile(`\$\{?([A-Za-z_][A-Za-z0-9_]*)`)

type File struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}

type Manifest struct {
	Version          int      `json:"version"`
	EntryPoint       string   `json:"entryPoint"`
	ComposeFiles     []string `json:"composeFiles"`
	Files            []File   `json:"files"`
	EnvironmentNames []string `json:"environmentNames"`
	Requirements     []string `json:"requirements"`
}

func validName(name string) bool {
	return fs.ValidPath(name) && name != "." && name != ManifestName && !strings.ContainsAny(name, "\\:\x00")
}

type Snapshot struct {
	Content  []byte
	Revision string
}

type projectFile struct {
	name    string
	content []byte
}

type project struct {
	manifest Manifest
	files    []projectFile
}

// Read returns entry-point content and a revision over all declared files from
// the same read. A later external edit changes the revision without redeploying.
func Read(ctx context.Context, directory, entryPoint string, additional []string) (*Snapshot, error) {
	project, err := readProject(ctx, directory, entryPoint, additional, nil)
	if err != nil {
		return nil, err
	}
	identity, err := json.Marshal(struct {
		ComposeFiles []string
		Files        []File
	}{project.manifest.ComposeFiles, project.manifest.Files})
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(identity)
	for _, file := range project.files {
		if file.name == entryPoint {
			return &Snapshot{Content: file.content, Revision: "sha256:" + hex.EncodeToString(hash[:])}, nil
		}
	}
	return nil, errors.New("entry-point missing from project")
}

// Export returns a complete deterministic archive or an error. Only declared
// files are read. os.Root confines reads even if an external editor swaps paths.
func Export(ctx context.Context, directory, entryPoint string, additional, environmentNames []string) ([]byte, error) {
	project, err := readProject(ctx, directory, entryPoint, additional, environmentNames)
	if err != nil {
		return nil, err
	}
	var buffer bytes.Buffer
	writer := zip.NewWriter(&buffer)
	for _, file := range project.files {
		if err := addFile(writer, file.name, file.content); err != nil {
			return nil, err
		}
	}
	metadata, err := json.MarshalIndent(project.manifest, "", "  ")
	if err != nil {
		return nil, err
	}
	if err := addFile(writer, ManifestName, append(metadata, '\n')); err != nil {
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func readProject(ctx context.Context, directory, entryPoint string, additional, environmentNames []string) (*project, error) {
	if len(additional) > 63 {
		return nil, errors.New("too many Compose files")
	}
	names := append([]string{entryPoint}, additional...)
	seen := make(map[string]bool, len(names))
	for _, name := range names {
		if !validName(name) || seen[name] {
			return nil, errors.New("invalid or duplicate Compose file path")
		}
		seen[name] = true
	}
	composeFiles := append([]string(nil), names...)
	sort.Strings(names)
	root, err := os.OpenRoot(directory)
	if err != nil {
		return nil, errors.New("cannot open project directory")
	}
	defer root.Close()
	manifest := Manifest{Version: 1, EntryPoint: entryPoint, ComposeFiles: composeFiles, EnvironmentNames: []string{}, Requirements: []string{
		"Source files retain literal values, which may contain secrets. Review before sharing.",
		"Supply environment values separately. Stored environment values, Vault values and credentials are not exported.",
		"Supply referenced bind directories, build contexts, secret/config files and external networks/volumes separately.",
		"Compose include/extends dependencies beyond the declared files are not bundled. Validate with docker compose before deployment.",
	}}
	for _, name := range environmentNames {
		if name != "" {
			manifest.EnvironmentNames = append(manifest.EnvironmentNames, name)
		}
	}
	sort.Strings(manifest.EnvironmentNames)
	manifest.EnvironmentNames = compact(manifest.EnvironmentNames)
	files := make([]projectFile, 0, len(names))
	total := int64(0)
	for _, name := range names {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		// Reject symlinks in every observed component, including links that stay
		// within the project. Root additionally prevents an escaping swap race.
		parts := strings.Split(name, "/")
		for index := range parts {
			info, err := root.Lstat(path.Join(parts[:index+1]...))
			if err != nil || info.Mode()&os.ModeSymlink != 0 {
				return nil, errors.New("Compose input missing or symlinked")
			}
			if index == len(parts)-1 && !info.Mode().IsRegular() {
				return nil, errors.New("Compose input must be a regular file")
			}
		}
		file, err := openRegular(root, name)
		if err != nil {
			return nil, errors.New("cannot read Compose input")
		}
		info, statErr := file.Stat()
		if statErr != nil || !info.Mode().IsRegular() {
			file.Close()
			return nil, errors.New("Compose input must be a regular file")
		}
		stop := context.AfterFunc(ctx, func() { file.Close() })
		content, readErr := io.ReadAll(io.LimitReader(file, maxBytes-total+1))
		after, statErr := file.Stat()
		stop()
		closeErr := file.Close()
		if readErr != nil || closeErr != nil {
			return nil, errors.New("cannot read complete Compose input")
		}
		if statErr != nil || info.Size() != after.Size() || !info.ModTime().Equal(after.ModTime()) {
			return nil, errors.New("Compose input changed during export; retry")
		}
		total += int64(len(content))
		if total > maxBytes {
			return nil, errors.New("Compose project exceeds export limit")
		}
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		digest := sha256.Sum256(content)
		for _, variable := range interpolation.FindAllStringSubmatch(strings.ReplaceAll(string(content), "$$", ""), -1) {
			manifest.EnvironmentNames = append(manifest.EnvironmentNames, variable[1])
		}
		manifest.Files = append(manifest.Files, File{Path: name, SHA256: hex.EncodeToString(digest[:])})
		files = append(files, projectFile{name: name, content: content})
	}
	sort.Strings(manifest.EnvironmentNames)
	manifest.EnvironmentNames = compact(manifest.EnvironmentNames)
	return &project{manifest: manifest, files: files}, nil
}

func compact(values []string) []string {
	result := values[:0]
	for _, value := range values {
		if len(result) == 0 || result[len(result)-1] != value {
			result = append(result, value)
		}
	}
	return result
}

func addFile(writer *zip.Writer, name string, content []byte) error {
	header := &zip.FileHeader{Name: name, Method: zip.Deflate}
	header.SetModTime(time.Date(1980, 1, 1, 0, 0, 0, 0, time.UTC))
	header.SetMode(0o600)
	file, err := writer.CreateHeader(header)
	if err != nil {
		return fmt.Errorf("create export entry: %w", err)
	}
	_, err = file.Write(content)
	return err
}
