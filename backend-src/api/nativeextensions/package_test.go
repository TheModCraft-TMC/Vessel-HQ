package nativeextensions

import (
	"archive/zip"
	"bytes"
	"encoding/binary"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/internal/extensiontest"
	"github.com/stretchr/testify/require"
)

type archiveInput struct {
	name   string
	data   []byte
	mode   os.FileMode
	method uint16
}

func makeArchive(t *testing.T, inputs []archiveInput) []byte {
	t.Helper()
	var buffer bytes.Buffer
	writer := zip.NewWriter(&buffer)
	for _, input := range inputs {
		header := &zip.FileHeader{Name: input.name, Method: input.method}
		mode := input.mode
		if mode == 0 {
			mode = 0o644
		}
		header.SetMode(mode)
		file, err := writer.CreateHeader(header)
		require.NoError(t, err)
		_, err = file.Write(input.data)
		require.NoError(t, err)
	}
	require.NoError(t, writer.Close())
	return buffer.Bytes()
}
func referenceInputs(t *testing.T) []archiveInput {
	t.Helper()
	return []archiveInput{{name: "manifest.json", data: []byte(extensiontest.Manifest)}, {name: "ui/index.tsx", data: []byte(extensiontest.Source)}}
}
func TestPackageMatchesNodeReferenceDigest(t *testing.T) {
	bundle, err := InspectPackage(makeArchive(t, referenceInputs(t)))
	require.NoError(t, err)
	require.Equal(t, "sha256:7352da43730269f8c7720f389d89865efd42364932e0d85f541fb7d9d98af4b9", bundle.Manifest.PackageDigest)
	require.True(t, strings.HasPrefix(bundle.ArchiveDigest, "sha256:"))
}
func TestPackageRejectsUnsafeInputs(t *testing.T) {
	for _, test := range []struct {
		name   string
		change func([]archiveInput) []archiveInput
	}{
		{"zip slip", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "../outside", data: []byte("x")})
		}},
		{"absolute", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "/ui/evil.ts", data: []byte("x")})
		}},
		{"backslash", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: `ui\evil.ts`, data: []byte("x")})
		}},
		{"duplicate", func(v []archiveInput) []archiveInput { return append(v, v[0]) }},
		{"link", func(v []archiveInput) []archiveInput { v[1].mode = os.ModeSymlink | 0o777; return v }},
		{"setuid", func(v []archiveInput) []archiveInput { v[1].mode = os.ModeSetuid | 0o644; return v }},
		{"executable UI", func(v []archiveInput) []archiveInput { v[1].mode = 0o755; return v }},
		{"lifecycle script", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "install.sh", data: []byte("exit")})
		}},
		{"undeclared backend", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "backend/linux-amd64/extension", data: []byte("x")})
		}},
		{"undeclared empty directory", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "backend/", mode: os.ModeDir | 0o755})
		}},
		{"directory collision", func(v []archiveInput) []archiveInput { return append(v, archiveInput{name: "ui", data: []byte("x")}) }},
		{"deep path", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "ui/" + strings.Repeat("a/", 16) + "file.ts", data: []byte("x")})
		}},
		{"digest mismatch", func(v []archiveInput) []archiveInput { v[1].data = []byte("tampered"); return v }},
		{"duplicate manifest keys", func(v []archiveInput) []archiveInput {
			v[0].data = bytes.Replace(v[0].data, []byte(`"id":`), []byte(`"id":"conflict", "id":`), 1)
			return v
		}},
		{"case alias field", func(v []archiveInput) []archiveInput {
			v[0].data = bytes.Replace(v[0].data, []byte(`"capability":`), []byte(`"Capability":`), 1)
			return v
		}},
		{"compression bomb", func(v []archiveInput) []archiveInput {
			return append(v, archiveInput{name: "ui/bomb.ts", data: bytes.Repeat([]byte("x"), 1<<20), method: zip.Deflate})
		}},
		{"too many entries", func(v []archiveInput) []archiveInput {
			for i := 0; i < 513; i++ {
				v = append(v, archiveInput{name: "ui/" + strings.Repeat("a", i+1) + ".ts", data: []byte("x")})
			}
			return v
		}},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, err := InspectPackage(makeArchive(t, test.change(referenceInputs(t))))
			require.Error(t, err)
		})
	}
	_, err := InspectPackage(nil)
	require.Error(t, err)
}
func minimalELF(machine uint16) []byte {
	data := make([]byte, 121)
	copy(data, []byte{0x7f, 'E', 'L', 'F', 2, 1, 1})
	binary.LittleEndian.PutUint16(data[16:], 2)
	binary.LittleEndian.PutUint16(data[18:], machine)
	binary.LittleEndian.PutUint32(data[20:], 1)
	binary.LittleEndian.PutUint64(data[24:], 0x400078)
	binary.LittleEndian.PutUint64(data[32:], 64)
	binary.LittleEndian.PutUint16(data[52:], 64)
	binary.LittleEndian.PutUint16(data[54:], 56)
	binary.LittleEndian.PutUint16(data[56:], 1)
	binary.LittleEndian.PutUint16(data[58:], 64)
	binary.LittleEndian.PutUint32(data[64:], 1)
	binary.LittleEndian.PutUint32(data[68:], 5)
	binary.LittleEndian.PutUint64(data[80:], 0x400000)
	binary.LittleEndian.PutUint64(data[88:], 0x400000)
	binary.LittleEndian.PutUint64(data[96:], 121)
	binary.LittleEndian.PutUint64(data[104:], 121)
	binary.LittleEndian.PutUint64(data[112:], 0x1000)
	data[120] = 0xc3
	return data
}
func TestBackendELFPlatformAndInventory(t *testing.T) {
	require.NoError(t, validateExecutable(minimalELF(62), "linux-amd64"))
	require.NoError(t, validateExecutable(minimalELF(183), "linux-arm64"))
	require.Error(t, validateExecutable(minimalELF(62), "linux-arm64"))
	require.Error(t, validateExecutable([]byte("#!/bin/sh"), "linux-amd64"))
	foreign := minimalELF(62)
	foreign[7] = 9
	require.Error(t, validateExecutable(foreign, "linux-amd64"))
	binaryBytes := minimalELF(62)
	executable := true
	inventory := map[string]sourceEntry{"backend": {Type: "directory"}, "backend/linux-amd64": {Type: "directory"}, "backend/linux-amd64/extension": {Type: "file", Digest: sha(binaryBytes), Executable: &executable}}
	digestBytes, err := json.MarshalIndent(inventory, "", "  ")
	require.NoError(t, err)
	manifest := Manifest{ID: "org.example.backend", Name: "Backend", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + sha(append(digestBytes, '\n')), Permissions: []Permission{}, Backend: &Backend{Type: "executable", Entrypoints: map[string]string{"linux-amd64": "backend/linux-amd64/extension"}}}
	manifestBytes, err := json.Marshal(manifest)
	require.NoError(t, err)
	inputs := []archiveInput{{name: "manifest.json", data: manifestBytes}, {name: "backend/linux-amd64/extension", data: binaryBytes, mode: 0o644}}
	bundle, err := InspectPackage(makeArchive(t, inputs))
	require.NoError(t, err)
	require.Equal(t, manifest.PackageDigest, bundle.Manifest.PackageDigest)
	inputs[1].mode = 0o755
	bundle, err = InspectPackage(makeArchive(t, inputs))
	require.NoError(t, err)
	require.Equal(t, manifest.PackageDigest, bundle.Manifest.PackageDigest)
	_, err = InspectPackage(makeArchive(t, append(inputs, archiveInput{name: "ui/", mode: os.ModeDir | 0o755})))
	require.Error(t, err)
	manifest.Backend.Entrypoints["darwin-arm64"] = "backend/darwin-arm64/extension"
	require.Error(t, manifest.Validate())
}
