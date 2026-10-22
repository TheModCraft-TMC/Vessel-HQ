package nativeextensions

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
)

func TestExtensionStoragePersistsAndEnforcesAuthority(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	admin := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	reader := &portainer.User{Username: "reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(admin))
	require.NoError(t, store.User().Create(reader))
	auth, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	token, _, err := auth.GenerateToken(&portainer.TokenData{ID: admin.ID, Role: admin.Role})
	require.NoError(t, err)
	readerToken, _, err := auth.GenerateToken(&portainer.TokenData{ID: reader.ID, Role: reader.Role})
	require.NoError(t, err)
	h := NewHandler(security.NewRequestBouncer(t.Context(), store, auth, apikey.NewAPIKeyService(nil, nil)))
	h.DataStore = store
	permissions := []domain.Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}, {Capability: "storage.read", EnvironmentIDs: []int{}}, {Capability: "storage.write", EnvironmentIDs: []int{}}}
	record := domain.Record{Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions, Manifest: domain.Manifest{ID: "persistent-notes", Name: "Notes", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: permissions}}
	require.NoError(t, store.NativeExtension().Create(&record))
	call := func(method, path, credential string, input any) *httptest.ResponseRecorder {
		var body bytes.Buffer
		if input != nil {
			if err := json.NewEncoder(&body).Encode(input); err != nil {
				panic(err)
			}
		}
		r := httptest.NewRequest(method, path, &body)
		if credential != "" {
			r.Header.Set("Authorization", "Bearer "+credential)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	path := fmt.Sprintf("/native-extensions/%d/storage", record.ID)
	readPath := path + "?revision=1&packageDigest=" + record.Manifest.PackageDigest
	input := storageRequest{Revision: 1, PackageDigest: record.Manifest.PackageDigest, Version: 0, Text: "a persistent note"}
	for _, method := range []string{"GET", "PUT"} {
		require.Equal(t, 401, call(method, readPath, "", input).Code)
		require.Equal(t, 403, call(method, readPath, readerToken, input).Code)
	}
	w := call("GET", readPath, token, nil)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.JSONEq(t, `{"text":"","version":0}`, w.Body.String())
	// Two editors cannot silently overwrite each other.
	var wg sync.WaitGroup
	codes := make(chan int, 2)
	for range 2 {
		wg.Go(func() { codes <- call("PUT", path, token, input).Code })
	}
	wg.Wait()
	close(codes)
	counts := map[int]int{}
	for code := range codes {
		counts[code]++
	}
	require.Equal(t, 1, counts[200])
	require.Equal(t, 1, counts[409])
	saved, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, &domain.Note{Text: input.Text, Version: 1}, saved.Note)
	w = call("GET", readPath, token, nil)
	require.Equal(t, 200, w.Code)
	require.Contains(t, w.Body.String(), input.Text)
	// A storage write without an auditable administrator must roll back the note.
	rollbackBody, err := json.Marshal(storageRequest{Revision: 1, PackageDigest: record.Manifest.PackageDigest, Version: 1, Text: "must not commit"})
	require.NoError(t, err)
	unauditable := mux.SetURLVars(httptest.NewRequest("PUT", path, bytes.NewReader(rollbackBody)), map[string]string{"id": fmt.Sprint(record.ID)})
	require.NotNil(t, h.writeStorage(httptest.NewRecorder(), unauditable))
	afterRollback, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, saved.Note, afterRollback.Note)
	metadata := call("GET", "/native-extensions", token, nil)
	require.Equal(t, 200, metadata.Code)
	require.NotContains(t, metadata.Body.String(), "a persistent note")
	require.NotContains(t, metadata.Body.String(), `"note"`)
	input.Version = 1
	input.Revision = 2
	require.Equal(t, 409, call("PUT", path, token, input).Code)
	input.Revision = 1
	input.PackageDigest = "sha256:" + strings.Repeat("b", 64)
	require.Equal(t, 409, call("PUT", path, token, input).Code)
	input.PackageDigest = record.Manifest.PackageDigest
	input.Text = strings.Repeat("x", 16385)
	require.Equal(t, 400, call("PUT", path, token, input).Code)
	input.Text = "new text"
	// Read and write grants are independent and neither grants infrastructure access.
	saved.Grants = permissions[:2]
	require.NoError(t, store.NativeExtension().Update(record.ID, saved))
	require.Equal(t, 403, call("PUT", path, token, input).Code)
	require.Equal(t, 200, call("GET", readPath, token, nil).Code)
	saved.Status = "disabled"
	require.NoError(t, store.NativeExtension().Update(record.ID, saved))
	require.Equal(t, 403, call("GET", readPath, token, nil).Code)
	require.Equal(t, 403, call("PUT", path, token, input).Code)
	// Registration upgrades retain data but clear grants and bind subsequent access to the new revision.
	_, err = h.persistRegistration(httptest.NewRequest("POST", "/", nil), record.Manifest, false, "", "extension.register")
	require.Error(t, err) // No admin context: audit failure must roll back the entire mutation.
	unchanged, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, saved, unchanged)
	require.Equal(t, 200, call("POST", "/native-extensions", token, record.Manifest).Code)
	unchanged, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, saved.Note, unchanged.Note)
	require.Equal(t, 2, unchanged.Revision)
	logs, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	writes := 0
	for _, log := range logs {
		if log.Action == "extension.storage.write" {
			writes++
			payload, err := base64.StdEncoding.DecodeString(log.Payload)
			require.NoError(t, err)
			require.NotContains(t, string(payload), "persistent note")
		}
	}
	require.Equal(t, 1, writes)
}
