package main

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/nativeextensions"
)

func archiveFixture(t *testing.T) (string, string) {
	t.Helper()
	ui := []byte("export default function Demo() { return null; }\n")
	fileDigest := sha256.Sum256(ui)
	inventory := fmt.Sprintf("{\n  \"ui\": {\n    \"type\": \"directory\"\n  },\n  \"ui/index.tsx\": {\n    \"type\": \"file\",\n    \"digest\": \"%s\",\n    \"executable\": false\n  }\n}\n", hex.EncodeToString(fileDigest[:]))
	packageDigest := sha256.Sum256([]byte(inventory))
	manifest := nativeextensions.Manifest{ID: "example-demo", Name: "Demo", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + hex.EncodeToString(packageDigest[:]), Permissions: []nativeextensions.Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}}, UI: &nativeextensions.UI{Entry: "ui/index.tsx", Slots: []nativeextensions.UISlot{{ID: "overview", Title: "Overview", Slot: "extension.page"}}}}
	manifestBytes, _ := json.Marshal(manifest)
	var buffer bytes.Buffer
	writer := zip.NewWriter(&buffer)
	for _, entry := range []struct {
		name string
		data []byte
	}{{"manifest.json", manifestBytes}, {"ui/", nil}, {"ui/index.tsx", ui}} {
		header := &zip.FileHeader{Name: entry.name, Method: zip.Deflate}
		if strings.HasSuffix(entry.name, "/") {
			header.SetMode(os.ModeDir | 0o755)
		} else {
			header.SetMode(0o644)
		}
		file, err := writer.CreateHeader(header)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := file.Write(entry.data); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(t.TempDir(), "example.vesselhq")
	if err := os.WriteFile(file, buffer.Bytes(), 0o600); err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256(buffer.Bytes())
	return file, "sha256:" + hex.EncodeToString(digest[:])
}

func TestExtractVerifiedSourceAndRefuseOverwrite(t *testing.T) {
	archive, digest := archiveFixture(t)
	destination := filepath.Join(t.TempDir(), "package")
	var output bytes.Buffer
	if err := extract(archive, digest, destination, &output); err != nil {
		t.Fatal(err)
	}
	if source, err := os.ReadFile(filepath.Join(destination, "ui/index.tsx")); err != nil || !bytes.Contains(source, []byte("function Demo")) {
		t.Fatalf("source not extracted: %v", err)
	}
	if stat, err := os.Stat(destination); err != nil || stat.Mode().Perm() != 0o700 {
		t.Fatal("extraction directory must be private")
	}
	if err := extract(archive, digest, destination, &output); err == nil {
		t.Fatal("existing output overwritten")
	}
}

func TestExtractRejectsUntrustedDigestBeforeCreatingDirectory(t *testing.T) {
	archive, _ := archiveFixture(t)
	destination := filepath.Join(t.TempDir(), "package")
	if err := extract(archive, "sha256:"+strings.Repeat("0", 64), destination, &bytes.Buffer{}); err == nil {
		t.Fatal("forged archive accepted")
	}
	if _, err := os.Stat(destination); !os.IsNotExist(err) {
		t.Fatal("rejected package created filesystem output")
	}
}
