package nativeextensions

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/extensiontest"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
)

type packageFileService struct {
	portainer.FileService
	root string
}

func (f packageFileService) GetDatastorePath() string { return f.root }
func uploadedFixture(t *testing.T) []byte {
	t.Helper()
	var data bytes.Buffer
	writer := zip.NewWriter(&data)
	for _, fixture := range []struct{ name, source string }{{"manifest.json", extensiontest.Manifest}, {"ui/index.tsx", extensiontest.Source}} {
		name, contents := fixture.name, []byte(fixture.source)
		header := &zip.FileHeader{Name: name, Method: zip.Store}
		header.SetMode(0o644)
		file, err := writer.CreateHeader(header)
		require.NoError(t, err)
		_, err = file.Write(contents)
		require.NoError(t, err)
	}
	require.NoError(t, writer.Close())
	return data.Bytes()
}
func TestUploadStoresVerifiedArchiveAndRevokesPriorApproval(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	root := t.TempDir()
	h := &Handler{DataStore: store, FileService: packageFileService{root: root}}
	archive := uploadedFixture(t)
	upload := func(name string, data []byte) (domain.Record, int) {
		var body bytes.Buffer
		writer := multipart.NewWriter(&body)
		file, err := writer.CreateFormFile("file", name)
		require.NoError(t, err)
		_, err = file.Write(data)
		require.NoError(t, err)
		require.NoError(t, writer.Close())
		r := httptest.NewRequest("POST", "/native-extensions/upload", &body)
		r.Header.Set("Content-Type", writer.FormDataContentType())
		r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{IsAdmin: true, User: &portainer.User{Username: "admin"}}))
		w := httptest.NewRecorder()
		handlerErr := h.upload(w, r)
		if handlerErr != nil {
			return domain.Record{}, handlerErr.StatusCode
		}
		var record domain.Record
		require.NoError(t, json.Unmarshal(w.Body.Bytes(), &record))
		return record, w.Code
	}
	record, status := upload("demo.vesselhq", archive)
	require.Equal(t, 200, status)
	require.True(t, record.PackageAvailable)
	require.Equal(t, "pending_approval", record.Status)
	require.False(t, record.TrustedNativeUI)
	require.False(t, record.ServiceReadEnabled)
	require.Empty(t, record.Grants)
	storedPath := filepath.Join(root, "native-extensions", "packages", strings.TrimPrefix(record.ArchiveDigest, "sha256:")+".vesselhq")
	stored, err := os.ReadFile(storedPath)
	require.NoError(t, err)
	require.Equal(t, archive, stored)
	info, err := os.Stat(storedPath)
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0o600), info.Mode().Perm())
	record.Status = "approved"
	record.TrustedNativeUI = true
	record.ServiceReadEnabled = true
	record.Grants = record.Manifest.Permissions
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	updated, status := upload("demo.VESSELHQ", archive)
	require.Equal(t, 200, status)
	require.Equal(t, record.ID, updated.ID)
	require.Equal(t, 2, updated.Revision)
	require.Empty(t, updated.Grants)
	require.False(t, updated.TrustedNativeUI)
	require.False(t, updated.ServiceReadEnabled)
	_, status = upload("demo.zip", archive)
	require.Equal(t, 400, status)
	_, status = upload("demo.vesselhq", []byte("invalid"))
	require.Equal(t, 400, status)
	all, err := store.NativeExtension().ReadAll()
	require.NoError(t, err)
	require.Len(t, all, 1)
	require.Equal(t, 2, all[0].Revision)
	// A storage error must leave the registry and previous archive untouched.
	blockedRoot := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(blockedRoot, "native-extensions"), []byte("blocked"), 0o600))
	h.FileService = packageFileService{root: blockedRoot}
	_, status = upload("demo.vesselhq", archive)
	require.Equal(t, 500, status)
	all, err = store.NativeExtension().ReadAll()
	require.NoError(t, err)
	require.Equal(t, 2, all[0].Revision)
}
func TestImmutableArchiveStorageRejectsSymlinksAndTampering(t *testing.T) {
	root := t.TempDir()
	data := []byte("archive")
	actual := sha256.Sum256(data)
	sum := "sha256:" + hex.EncodeToString(actual[:])
	require.Error(t, storePackage(root, "sha256:"+strings.Repeat("a", 64), data))
	require.NoError(t, storePackage(root, sum, data))
	require.NoError(t, storePackage(root, sum, data))
	target := filepath.Join(root, "native-extensions", "packages", hex.EncodeToString(actual[:])+".vesselhq")
	require.NoError(t, os.WriteFile(target, []byte("corrupt"), 0o600))
	require.Error(t, storePackage(root, sum, data))
	second := t.TempDir()
	require.NoError(t, os.Symlink(root, filepath.Join(second, "native-extensions")))
	require.Error(t, storePackage(second, sum, data))
}
