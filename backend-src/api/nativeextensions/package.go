package nativeextensions

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"debug/elf"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"path"
	"regexp"
	"strings"
)

const MaxArchiveSize int64 = 64 << 20
const maxExpandedSize uint64 = 256 << 20
const maxEntrySize uint64 = 128 << 20
const maxPackageEntries = 512

var packagePath = regexp.MustCompile(`^[A-Za-z0-9._/-]+$`)

type Package struct {
	Manifest      Manifest
	ArchiveDigest string
}
type sourceEntry struct {
	Type       string `json:"type"`
	Digest     string `json:"digest,omitempty"`
	Executable *bool  `json:"executable,omitempty"`
}

func sha(bytes []byte) string { value := sha256.Sum256(bytes); return hex.EncodeToString(value[:]) }
func validPackagePath(value string) bool {
	if value == "" || len(value) > 256 || !packagePath.MatchString(value) || path.IsAbs(value) || path.Clean(value) != value || len(strings.Split(value, "/")) > 16 {
		return false
	}
	for _, part := range strings.Split(value, "/") {
		if part == "" || part == "." || part == ".." {
			return false
		}
	}
	return true
}

// InspectPackage validates the complete ZIP in memory without extraction or execution.
// PackageDigest binds a deterministic source inventory, shared with the trusted
// Node assembler. ArchiveDigest binds the exact bytes retained on disk.
func InspectPackage(data []byte) (Package, error) {
	if len(data) == 0 || int64(len(data)) > MaxArchiveSize {
		return Package{}, errors.New("archive exceeds the 64 MiB limit or is empty")
	}
	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return Package{}, fmt.Errorf("invalid ZIP archive: %w", err)
	}
	if len(archive.File) == 0 || len(archive.File) > maxPackageEntries {
		return Package{}, errors.New("invalid package entry count")
	}
	files := map[string][]byte{}
	modes := map[string]bool{}
	entries := map[string]sourceEntry{}
	seen := map[string]bool{}
	var total uint64
	addDirs := func(name string) error {
		for dir := path.Dir(name); dir != "."; dir = path.Dir(dir) {
			if entry, ok := entries[dir]; ok && entry.Type != "directory" {
				return errors.New("file/directory path collision")
			}
			entries[dir] = sourceEntry{Type: "directory"}
		}
		return nil
	}
	for _, file := range archive.File {
		name := strings.TrimSuffix(file.Name, "/")
		if !validPackagePath(name) || seen[name] {
			return Package{}, errors.New("unsafe or duplicate archive path")
		}
		seen[name] = true
		mode := file.Mode()
		directory := strings.HasSuffix(file.Name, "/")
		if mode&(fs.ModeSetuid|fs.ModeSetgid|fs.ModeSticky) != 0 || mode.Type() != 0 && !mode.IsDir() || directory != mode.IsDir() {
			return Package{}, errors.New("links and special archive entries are forbidden")
		}
		if name != "manifest.json" && name != "ui" && name != "backend" && !strings.HasPrefix(name, "ui/") && !strings.HasPrefix(name, "backend/") {
			return Package{}, errors.New("unsupported archive root")
		}
		if err := addDirs(name); err != nil {
			return Package{}, err
		}
		if old, ok := entries[name]; ok && old.Type == "directory" && !directory {
			return Package{}, errors.New("file/directory path collision")
		}
		if directory {
			if name == "manifest.json" || file.UncompressedSize64 != 0 {
				return Package{}, errors.New("invalid directory entry")
			}
			entries[name] = sourceEntry{Type: "directory"}
			continue
		}
		if !mode.IsRegular() {
			return Package{}, errors.New("archive file must be regular")
		}
		if file.UncompressedSize64 > maxEntrySize || file.UncompressedSize64 > maxExpandedSize-total {
			return Package{}, errors.New("expanded archive exceeds size limit")
		}
		compressed := file.CompressedSize64
		if compressed == 0 {
			compressed = 1
		}
		if file.UncompressedSize64 > compressed*100 {
			return Package{}, errors.New("archive compression ratio exceeds limit")
		}
		total += file.UncompressedSize64
		if name == "manifest.json" && file.UncompressedSize64 > 128<<10 {
			return Package{}, errors.New("manifest exceeds size limit")
		}
		reader, err := file.Open()
		if err != nil {
			return Package{}, err
		}
		contents, err := io.ReadAll(io.LimitReader(reader, int64(file.UncompressedSize64)+1))
		closeErr := reader.Close()
		if err != nil {
			return Package{}, err
		}
		if closeErr != nil {
			return Package{}, closeErr
		}
		if uint64(len(contents)) != file.UncompressedSize64 {
			return Package{}, errors.New("archive size mismatch")
		}
		executable := mode&0o111 != 0
		files[name] = contents
		modes[name] = executable
		entries[name] = sourceEntry{Type: "file", Digest: sha(contents), Executable: &executable}
	}
	if len(entries) > maxPackageEntries {
		return Package{}, errors.New("too many explicit or implicit archive entries")
	}
	manifestBytes, ok := files["manifest.json"]
	if !ok {
		return Package{}, errors.New("missing manifest.json")
	}
	if modes["manifest.json"] {
		return Package{}, errors.New("manifest cannot be executable")
	}
	var manifest Manifest
	if err := decodePackageManifest(manifestBytes, &manifest); err != nil {
		return Package{}, err
	}
	if err := manifest.Validate(); err != nil {
		return Package{}, err
	}
	if manifest.UI == nil && manifest.Backend == nil {
		return Package{}, errors.New("package must declare UI or backend")
	}
	backendFiles := map[string]string{}
	if manifest.Backend != nil {
		for platform, entry := range manifest.Backend.Entrypoints {
			backendFiles[entry] = platform
		}
	}
	allowedDirs := map[string]bool{"ui": manifest.UI != nil, "backend": manifest.Backend != nil}
	for entry := range backendFiles {
		allowedDirs[path.Dir(entry)] = true
	}
	for name, entry := range entries {
		if name == "manifest.json" {
			continue
		}
		if entry.Type == "directory" {
			if !allowedDirs[name] && !(manifest.UI != nil && strings.HasPrefix(name, "ui/")) {
				return Package{}, errors.New("undeclared package directory")
			}
			continue
		}
		executable := false
		if platform, ok := backendFiles[name]; ok {
			if err := validateExecutable(files[name], platform); err != nil {
				return Package{}, err
			}
			executable = true
		} else if manifest.UI == nil || !strings.HasPrefix(name, "ui/") || !(strings.HasSuffix(name, ".ts") || strings.HasSuffix(name, ".tsx") || strings.HasSuffix(name, ".css")) || modes[name] {
			return Package{}, errors.New("undeclared file or executable UI source")
		}
		entry.Executable = &executable
		entries[name] = entry
	}
	for entry := range backendFiles {
		if _, ok := files[entry]; !ok {
			return Package{}, errors.New("missing declared backend executable")
		}
	}
	if manifest.UI != nil {
		if _, ok := files[manifest.UI.Entry]; !ok {
			return Package{}, errors.New("missing UI entrypoint")
		}
	}
	delete(entries, "manifest.json")
	inventory, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return Package{}, err
	}
	inventory = append(inventory, '\n')
	if manifest.PackageDigest != "sha256:"+sha(inventory) {
		return Package{}, errors.New("package digest does not match source inventory")
	}
	return Package{Manifest: manifest, ArchiveDigest: "sha256:" + sha(data)}, nil
}
func validateExecutable(contents []byte, platform string) error {
	binary, err := elf.NewFile(bytes.NewReader(contents))
	if err != nil {
		return errors.New("backend executable must be a valid ELF binary")
	}
	defer binary.Close()
	expected := elf.EM_X86_64
	if platform == "linux-arm64" {
		expected = elf.EM_AARCH64
	}
	if binary.Class != elf.ELFCLASS64 || binary.Data != elf.ELFDATA2LSB || (binary.OSABI != elf.ELFOSABI_NONE && binary.OSABI != elf.ELFOSABI_LINUX) || binary.Machine != expected || binary.Type != elf.ET_EXEC && binary.Type != elf.ET_DYN {
		return errors.New("backend executable platform mismatch")
	}
	executableSegment := false
	for _, program := range binary.Progs {
		if program.Type == elf.PT_LOAD && program.Flags&elf.PF_X != 0 && program.Filesz > 0 && program.Off <= uint64(len(contents)) && program.Filesz <= uint64(len(contents))-program.Off {
			executableSegment = true
		}
	}
	if !executableSegment {
		return errors.New("backend executable has no bounded executable load segment")
	}
	return nil
}

// Reject duplicate object members before decoding: conflicting manifests must not
// acquire different meanings in the Go host and JavaScript assembler.
func rejectDuplicateJSON(data []byte) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	var value func() error
	value = func() error {
		token, err := decoder.Token()
		if err != nil {
			return err
		}
		delimiter, ok := token.(json.Delim)
		if !ok {
			return nil
		}
		switch delimiter {
		case '{':
			seen := map[string]bool{}
			for decoder.More() {
				token, err := decoder.Token()
				if err != nil {
					return err
				}
				key, ok := token.(string)
				if !ok || seen[key] {
					return errors.New("duplicate manifest object member")
				}
				seen[key] = true
				if err := value(); err != nil {
					return err
				}
			}
		case '[':
			for decoder.More() {
				if err := value(); err != nil {
					return err
				}
			}
		default:
			return errors.New("invalid manifest JSON")
		}
		_, err = decoder.Token()
		return err
	}
	if err := value(); err != nil {
		return err
	}
	if _, err := decoder.Token(); err != io.EOF {
		return errors.New("expected one manifest JSON object")
	}
	return nil
}
func decodePackageManifest(data []byte, manifest *Manifest) error {
	if err := rejectDuplicateJSON(data); err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(manifest); err != nil {
		return err
	}
	var top map[string]json.RawMessage
	if err := json.Unmarshal(data, &top); err != nil {
		return err
	}
	if err := exactFields(top, "id", "name", "version", "description", "apiVersion", "packageDigest", "permissions", "ui", "backend"); err != nil {
		return err
	}
	var permissions []map[string]json.RawMessage
	if value := top["permissions"]; value != nil {
		if err := json.Unmarshal(value, &permissions); err != nil {
			return err
		}
	}
	for _, permission := range permissions {
		if err := exactFields(permission, "capability", "environmentIds", "stackIds"); err != nil {
			return err
		}
	}
	if value := top["ui"]; value != nil && string(value) != "null" {
		var ui map[string]json.RawMessage
		if err := json.Unmarshal(value, &ui); err != nil {
			return err
		}
		if err := exactFields(ui, "entry", "slots"); err != nil {
			return err
		}
		var slots []map[string]json.RawMessage
		if err := json.Unmarshal(ui["slots"], &slots); err != nil {
			return err
		}
		for _, slot := range slots {
			if err := exactFields(slot, "id", "title", "slot"); err != nil {
				return err
			}
		}
	}
	if value := top["backend"]; value != nil && string(value) != "null" {
		var backend map[string]json.RawMessage
		if err := json.Unmarshal(value, &backend); err != nil {
			return err
		}
		if err := exactFields(backend, "type", "entrypoints"); err != nil {
			return err
		}
	}
	return nil
}
func exactFields(value map[string]json.RawMessage, allowed ...string) error {
	for key := range value {
		found := false
		for _, name := range allowed {
			if key == name {
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("unsupported manifest field %q", key)
		}
	}
	return nil
}
