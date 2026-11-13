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

func TestSettingsLifecycle(t *testing.T) {
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
	record := domain.Record{Revision: 1, Status: "pending_approval", Manifest: domain.Manifest{ID: "org.example.settings", Name: "Settings", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64)}}
	require.NoError(t, store.NativeExtension().Create(&record))
	other := record
	other.ID = 0
	other.Manifest.ID = "org.example.other"
	require.NoError(t, store.NativeExtension().Create(&other))
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
	path := fmt.Sprintf("/native-extensions/%d/settings", record.ID)
	readPath := path + "?revision=1&packageDigest=" + record.Manifest.PackageDigest
	secret := "private-setting-never-return"
	input := settingsRequest{Revision: 1, PackageDigest: record.Manifest.PackageDigest, Values: map[string]string{"theme": "dark"}, Secrets: map[string]*string{"token": &secret}}
	for _, method := range []string{"GET", "PUT", "DELETE"} {
		require.Equal(t, 401, call(method, readPath, "", input).Code)
		require.Equal(t, 403, call(method, readPath, readerToken, input).Code)
	}
	require.Equal(t, 400, call("GET", path, token, nil).Code)
	require.Equal(t, 400, call("PUT", "/native-extensions/invalid/settings", token, input).Code)
	require.Equal(t, 404, call("GET", "/native-extensions/999/settings?revision=1&packageDigest="+record.Manifest.PackageDigest, token, nil).Code)
	w := call("GET", readPath, token, nil)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.Equal(t, "no-store", w.Header().Get("Cache-Control"))
	require.JSONEq(t, `{"version":0,"values":{},"secretKeys":[]}`, w.Body.String())
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
	w = call("GET", readPath, token, nil)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.JSONEq(t, `{"version":1,"values":{"theme":"dark"},"secretKeys":["token"]}`, w.Body.String())
	require.NotContains(t, w.Body.String(), secret)
	saved, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, secret, saved.Settings.Secrets["token"])
	isolated := fmt.Sprintf("/native-extensions/%d/settings?revision=1&packageDigest=%s", other.ID, other.Manifest.PackageDigest)
	w = call("GET", isolated, token, nil)
	require.Equal(t, 200, w.Code)
	require.JSONEq(t, `{"version":0,"values":{},"secretKeys":[]}`, w.Body.String())
	// Invalid/stale writes must preserve the stored configuration.
	input.Version = 1
	input.Values = map[string]string{"token": secret}
	input.Secrets = map[string]*string{"token": nil}
	require.Equal(t, 400, call("PUT", path, token, input).Code)
	input.Values = map[string]string{"../bad": "value"}
	require.Equal(t, 400, call("PUT", path, token, input).Code)
	input.Values = map[string]string{"theme": "light"}
	input.Secrets = nil
	input.Revision = 2
	require.Equal(t, 409, call("PUT", path, token, input).Code)
	input.Revision = 1
	input.PackageDigest = "sha256:" + strings.Repeat("b", 64)
	require.Equal(t, 409, call("PUT", path, token, input).Code)
	input.PackageDigest = record.Manifest.PackageDigest
	// Direct invocation without an auditable admin rolls the transaction back.
	body, err := json.Marshal(input)
	require.NoError(t, err)
	r := mux.SetURLVars(httptest.NewRequest("PUT", path, bytes.NewReader(body)), map[string]string{"id": fmt.Sprint(record.ID)})
	require.NotNil(t, h.settings(httptest.NewRecorder(), r))
	unchanged, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, saved.Settings, unchanged.Settings)
	// Public replacement retains omitted secrets; no registration response leaks data.
	w = call("PUT", path, token, input)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.NotContains(t, w.Body.String(), secret)
	w = call("GET", "/native-extensions", token, nil)
	require.NotContains(t, w.Body.String(), `"settings"`)
	require.NotContains(t, w.Body.String(), secret)
	w = call("POST", "/native-extensions", token, record.Manifest)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.NotContains(t, w.Body.String(), secret)
	upgraded, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, secret, upgraded.Settings.Secrets["token"])
	require.Equal(t, 2, upgraded.Settings.Version)
	require.Equal(t, 409, call("GET", readPath, token, nil).Code)
	// Settings administration remains available after disabling runtime grants.
	require.Equal(t, 200, call("POST", fmt.Sprintf("/native-extensions/%d/disable", record.ID), token, nil).Code)
	deletion := settingsRequest{Revision: 2, PackageDigest: record.Manifest.PackageDigest, Version: 2, Values: map[string]string{"theme": "light"}, Secrets: map[string]*string{"token": nil}}
	w = call("PUT", path, token, deletion)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.JSONEq(t, `{"version":3,"values":{"theme":"light"},"secretKeys":[]}`, w.Body.String())
	reset := settingsRequest{Revision: 2, PackageDigest: record.Manifest.PackageDigest, Version: 3}
	w = call("DELETE", path, token, reset)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.JSONEq(t, `{"version":4,"values":{},"secretKeys":[]}`, w.Body.String())
	require.Equal(t, 409, call("DELETE", path, token, reset).Code)
	require.Equal(t, 409, call("PUT", path, token, input).Code)
	reset.Version = 4
	reset.Secrets = map[string]*string{"token": &secret}
	require.Equal(t, 400, call("DELETE", path, token, reset).Code)
	// Invalid JSON errors must not echo secret request content.
	malformed := httptest.NewRequest("PUT", path, strings.NewReader(`{"`+secret+`":true}`))
	malformed.Header.Set("Authorization", "Bearer "+token)
	rejected := httptest.NewRecorder()
	h.ServeHTTP(rejected, malformed)
	require.Equal(t, 400, rejected.Code)
	require.NotContains(t, rejected.Body.String(), secret)
	require.Equal(t, 204, call("DELETE", fmt.Sprintf("/native-extensions/%d", record.ID), token, nil).Code)
	require.Equal(t, 404, call("GET", readPath, token, nil).Code)
	w = call("GET", isolated, token, nil)
	require.Equal(t, 200, w.Code)
	require.JSONEq(t, `{"version":0,"values":{},"secretKeys":[]}`, w.Body.String())
	logs, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	actions := map[string]int{}
	for _, log := range logs {
		actions[log.Action]++
		payload, err := base64.StdEncoding.DecodeString(log.Payload)
		require.NoError(t, err)
		require.NotContains(t, string(payload), secret)
		require.NotContains(t, string(payload), `"theme"`)
		require.NotContains(t, string(payload), `"token"`)
	}
	require.Equal(t, 3, actions["extension.settings.update"])
	require.Equal(t, 1, actions["extension.settings.reset"])
}
