package projectfiles

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestExportRoundTrip(t *testing.T) {
	directory := t.TempDir()
	inputs := map[string]string{"compose.yaml": "services:\n  café:\n    image: ${IMAGE:-alpine}\n    environment: [LITERAL=$${ESCAPED}]\n", "配置/override.yaml": "services:\n  café:\n    command: echo grüezi\n"}
	for name, content := range inputs {
		if err := os.MkdirAll(filepath.Dir(filepath.Join(directory, name)), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(directory, name), []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(directory, ".env"), []byte("SECRET=not-exported"), 0o600); err != nil {
		t.Fatal(err)
	}
	export := func() []byte {
		t.Helper()
		data, err := Export(context.Background(), directory, "compose.yaml", []string{"配置/override.yaml"}, []string{"TOKEN", "TOKEN"})
		if err != nil {
			t.Fatal(err)
		}
		return data
	}
	data := export()
	if !bytes.Equal(data, export()) {
		t.Fatal("export must be deterministic")
	}
	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		t.Fatal(err)
	}
	if len(archive.File) != 3 {
		t.Fatalf("unexpected files: %v", archive.File)
	}
	var manifest Manifest
	for _, file := range archive.File {
		stream, err := file.Open()
		if err != nil {
			t.Fatal(err)
		}
		content, err := io.ReadAll(stream)
		stream.Close()
		if err != nil {
			t.Fatal(err)
		}
		if file.Name == ManifestName {
			if err := json.Unmarshal(content, &manifest); err != nil {
				t.Fatal(err)
			}
		} else if string(content) != inputs[file.Name] {
			t.Fatalf("changed or undeclared file: %s", file.Name)
		}
	}
	if !reflect.DeepEqual(manifest.EnvironmentNames, []string{"IMAGE", "TOKEN"}) {
		t.Fatalf("variables: %v", manifest.EnvironmentNames)
	}
	if manifest.EntryPoint != "compose.yaml" || len(manifest.Files) != 2 || len(manifest.Requirements) == 0 {
		t.Fatalf("incomplete manifest: %+v", manifest)
	}
	for _, file := range manifest.Files {
		if len(file.SHA256) != 64 {
			t.Fatal("missing checksum")
		}
	}
}

func TestExportRejectsUnsafeIncompleteAndCancelledProjects(t *testing.T) {
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, "compose.yaml"), []byte("services: {}"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("compose.yaml", filepath.Join(directory, "alias.yaml")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(t.TempDir(), filepath.Join(directory, "outside")); err != nil {
		t.Fatal(err)
	}
	for _, files := range [][]string{{"../escape"}, {"/etc/passwd"}, {"missing.yaml"}, {"alias.yaml"}, {"outside/secret"}, {"compose.yaml"}, {ManifestName}, {"a\\b"}, {"."}} {
		data, err := Export(context.Background(), directory, "compose.yaml", files, nil)
		if err == nil || data != nil {
			t.Fatalf("accepted incomplete/unsafe project: %v", files)
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if data, err := Export(ctx, directory, "compose.yaml", nil, nil); err == nil || data != nil {
		t.Fatal("ignored cancellation")
	}
	if err := os.WriteFile(filepath.Join(directory, "large.yaml"), make([]byte, maxBytes+1), 0o600); err != nil {
		t.Fatal(err)
	}
	if data, err := Export(context.Background(), directory, "large.yaml", nil, nil); err == nil || data != nil {
		t.Fatal("ignored size limit")
	}
}

func TestRevisionIncludesExternalOverrideEdits(t *testing.T) {
	directory := t.TempDir()
	for name, content := range map[string]string{"compose.yaml": "services: {}", "override.yaml": "name: before"} {
		if err := os.WriteFile(filepath.Join(directory, name), []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	before, err := Read(context.Background(), directory, "compose.yaml", []string{"override.yaml"})
	if err != nil {
		t.Fatal(err)
	}
	if string(before.Content) != "services: {}" {
		t.Fatal("entry content did not match snapshot")
	}
	if err := os.WriteFile(filepath.Join(directory, "override.yaml"), []byte("name: after!"), 0o600); err != nil {
		t.Fatal(err)
	}
	after, err := Read(context.Background(), directory, "compose.yaml", []string{"override.yaml"})
	if err != nil {
		t.Fatal(err)
	}
	if before.Revision == after.Revision {
		t.Fatal("external override edit did not change project revision")
	}
}
