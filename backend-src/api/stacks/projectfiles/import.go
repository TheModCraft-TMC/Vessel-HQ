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
	"os"
	"path"
	"regexp"
	"strings"

	"go.yaml.in/yaml/v3"
)

const MaxArchiveBytes = 20 << 20

var yamlErrorLine = regexp.MustCompile(`^yaml: line ([0-9]+):`)

type Imported struct {
	manifest      Manifest
	files         map[string][]byte
	ArchiveDigest string
}

func (project *Imported) Manifest() Manifest      { return project.manifest }
func (project *Imported) File(name string) []byte { return project.files[name] }

// Store writes only the verified declared files beneath an already-owned empty
// project directory. Exclusive creation prevents overwriting an existing input.
func (project *Imported) Store(ctx context.Context, directory string) error {
	root, err := os.OpenRoot(directory)
	if err != nil {
		return err
	}
	defer root.Close()
	for _, name := range project.manifest.ComposeFiles {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := root.MkdirAll(path.Dir(name), 0o700); err != nil {
			return err
		}
		file, err := root.OpenFile(name, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
		if err != nil {
			return err
		}
		_, writeErr := file.Write(project.files[name])
		closeErr := file.Close()
		if writeErr != nil {
			return writeErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
	return ctx.Err()
}

// Import validates an archive entirely in memory. It does not extract paths,
// load referenced host files, expand interpolation, or contact an engine.
func Import(ctx context.Context, archive []byte) (*Imported, error) {
	if len(archive) > MaxArchiveBytes {
		return nil, errors.New("project archive exceeds import limit")
	}
	reader, err := zip.NewReader(bytes.NewReader(archive), int64(len(archive)))
	if err != nil || len(reader.File) < 2 || len(reader.File) > 65 {
		return nil, errors.New("invalid project archive")
	}
	files := make(map[string][]byte, len(reader.File))
	total := int64(0)
	for _, file := range reader.File {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		if (!validName(file.Name) && file.Name != ManifestName) || !file.Mode().IsRegular() || files[file.Name] != nil {
			return nil, errors.New("unsafe or duplicate project archive entry")
		}
		limit := int64(maxBytes) - total
		if file.Name == ManifestName {
			limit = 128 << 10
		}
		if file.UncompressedSize64 > uint64(limit) {
			return nil, errors.New("project archive exceeds expanded size limit")
		}
		stream, err := file.Open()
		if err != nil {
			return nil, errors.New("cannot read project archive")
		}
		content, err := io.ReadAll(io.LimitReader(stream, limit+1))
		stream.Close()
		if err != nil || int64(len(content)) > limit {
			return nil, errors.New("cannot read bounded project archive")
		}
		if file.Name != ManifestName {
			total += int64(len(content))
		}
		files[file.Name] = content
	}
	var manifest Manifest
	decoder := json.NewDecoder(bytes.NewReader(files[ManifestName]))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&manifest) != nil {
		return nil, errors.New("invalid project manifest")
	}
	var trailing any
	if decoder.Decode(&trailing) != io.EOF {
		return nil, errors.New("unexpected data after project manifest")
	}
	if manifest.Version != 1 || len(manifest.ComposeFiles) == 0 || len(manifest.ComposeFiles) > 64 || manifest.ComposeFiles[0] != manifest.EntryPoint || len(manifest.Files) != len(manifest.ComposeFiles) || len(files) != len(manifest.Files)+1 {
		return nil, errors.New("incomplete project file order or inventory")
	}
	declared := make(map[string]bool, len(manifest.Files))
	for _, file := range manifest.Files {
		content, found := files[file.Path]
		if !validName(file.Path) || declared[file.Path] || !found {
			return nil, errors.New("invalid project file inventory")
		}
		digest := sha256.Sum256(content)
		if file.SHA256 != hex.EncodeToString(digest[:]) {
			return nil, errors.New("project file checksum mismatch")
		}
		declared[file.Path] = true
		if err := validateComposeDocument(file.Path, content); err != nil {
			return nil, err
		}
	}
	for _, name := range manifest.ComposeFiles {
		if !declared[name] {
			return nil, errors.New("invalid or duplicate Compose file order")
		}
		delete(declared, name)
	}
	for _, name := range manifest.EnvironmentNames {
		if len(name) == 0 || len(name) > 256 || strings.ContainsAny(name, "=\x00\r\n") {
			return nil, errors.New("invalid project environment name")
		}
	}
	digest := sha256.Sum256(archive)
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return &Imported{manifest: manifest, files: files, ArchiveDigest: "sha256:" + hex.EncodeToString(digest[:])}, nil
}

func validateComposeDocument(name string, content []byte) error {
	var document yaml.Node
	parser := yaml.NewDecoder(bytes.NewReader(content))
	if err := parser.Decode(&document); err != nil {
		return composeSyntaxError(name, err)
	}
	if len(document.Content) != 1 || document.Content[0].Kind != yaml.MappingNode {
		return fmt.Errorf("Compose file %q must contain a YAML mapping", name)
	}
	if err := parser.Decode(new(yaml.Node)); err != io.EOF {
		if err != nil {
			return composeSyntaxError(name, err)
		}
		return fmt.Errorf("multiple YAML documents in %q", name)
	}
	return nil
}

// Use the parser's location, without returning its source-dependent text.
func composeSyntaxError(name string, err error) error {
	if location := yamlErrorLine.FindStringSubmatch(err.Error()); len(location) > 0 {
		return fmt.Errorf("invalid Compose YAML in %q at line %s", name, location[1])
	}
	return fmt.Errorf("invalid Compose YAML in %q", name)
}
