package projectfiles

import (
	"archive/zip"
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func projectFixture(t *testing.T) []byte {
	t.Helper()
	directory := t.TempDir()
	for name, content := range map[string]string{"compose.yaml": "services:\n  app:\n    image: busybox:1.37.0\n", "z.yaml": "services:\n  app:\n    command: echo first\n", "a.yaml": "services:\n  app:\n    command: echo final\n"} {
		if err := os.WriteFile(filepath.Join(directory, name), []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	archive, err := Export(context.Background(), directory, "compose.yaml", []string{"z.yaml", "a.yaml"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	return archive
}

func TestImportPreservesComposeOverrideOrderAndBytes(t *testing.T) {
	project, err := Import(context.Background(), projectFixture(t))
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(project.Manifest().ComposeFiles, []string{"compose.yaml", "z.yaml", "a.yaml"}) {
		t.Fatal("override order changed")
	}
	if string(project.File("a.yaml")) != "services:\n  app:\n    command: echo final\n" {
		t.Fatal("override bytes changed")
	}
	if project.ArchiveDigest == "" {
		t.Fatal("missing review identity")
	}
}

func TestImportRejectsTamperingTraversalSymlinksAndUndeclaredFiles(t *testing.T) {
	archive := projectFixture(t)
	for _, variant := range []string{"checksum", "traversal", "symlink", "duplicate", "undeclared"} {
		t.Run(variant, func(t *testing.T) {
			reader, err := zip.NewReader(bytes.NewReader(archive), int64(len(archive)))
			if err != nil {
				t.Fatal(err)
			}
			var buffer bytes.Buffer
			writer := zip.NewWriter(&buffer)
			for _, file := range reader.File {
				stream, err := file.Open()
				if err != nil {
					t.Fatal(err)
				}
				content, err := io.ReadAll(stream)
				stream.Close()
				if err != nil {
					t.Fatal(err)
				}
				header := &zip.FileHeader{Name: file.Name, Method: zip.Deflate}
				if file.Name == "a.yaml" {
					switch variant {
					case "checksum":
						content = []byte("services: {tampered: {image: alpine}}")
					case "traversal":
						header.Name = "../outside.yaml"
					case "symlink":
						header.SetMode(os.ModeSymlink | 0o777)
					}
				}
				entry, err := writer.CreateHeader(header)
				if err != nil {
					t.Fatal(err)
				}
				if _, err := entry.Write(content); err != nil {
					t.Fatal(err)
				}
			}
			if variant == "duplicate" || variant == "undeclared" {
				name := "a.yaml"
				if variant == "undeclared" {
					name = "secret.yaml"
				}
				if err := addFile(writer, name, []byte("services: {}")); err != nil {
					t.Fatal(err)
				}
			}
			if err := writer.Close(); err != nil {
				t.Fatal(err)
			}
			if project, err := Import(context.Background(), buffer.Bytes()); err == nil || project != nil {
				t.Fatal("unsafe archive accepted")
			}
		})
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if project, err := Import(ctx, archive); err == nil || project != nil {
		t.Fatal("cancelled import accepted")
	}
}
