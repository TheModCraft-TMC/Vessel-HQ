package nativeextensions

import (
	"bytes"
	"encoding/json"
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLifecycleAndAdminBoundary(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	admin := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(admin))
	user := &portainer.User{Username: "reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	j, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	at, _, err := j.GenerateToken(&portainer.TokenData{ID: admin.ID, Role: admin.Role})
	require.NoError(t, err)
	ut, _, err := j.GenerateToken(&portainer.TokenData{ID: user.ID, Role: user.Role})
	require.NoError(t, err)
	h := NewHandler(security.NewRequestBouncer(t.Context(), store, j, apikey.NewAPIKeyService(nil, nil)))
	h.DataStore = store
	call := func(method, path, token string, payload any) *httptest.ResponseRecorder {
		var body bytes.Buffer
		if payload != nil {
			require.NoError(t, json.NewEncoder(&body).Encode(payload))
		}
		r := httptest.NewRequest(method, path, &body)
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	manifest := domain.Manifest{ID: "org.example.demo", Name: "Demo", Version: "1.0.0", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: []domain.Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}, {Capability: "containers.read", EnvironmentIDs: []int{1, 2}}, {Capability: "environments.read", EnvironmentIDs: []int{1}}}}
	for _, route := range []struct {
		method, path string
		body         any
	}{{"GET", "/native-extensions", nil}, {"POST", "/native-extensions", manifest}, {"POST", "/native-extensions/upload", nil}, {"PUT", "/native-extensions/1/approval", domain.Approval{}}, {"POST", "/native-extensions/1/disable", nil}, {"DELETE", "/native-extensions/1", nil}} {
		require.Equal(t, 401, call(route.method, route.path, "", route.body).Code)
		require.Equal(t, 403, call(route.method, route.path, ut, route.body).Code)
	}
	w := call("POST", "/native-extensions", at, manifest)
	require.Equal(t, 200, w.Code, w.Body.String())
	var record domain.Record
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &record))
	require.Equal(t, "pending_approval", record.Status)
	require.False(t, record.ServiceReadEnabled)
	base := fmt.Sprintf("/native-extensions/%d", record.ID)
	a := domain.Approval{Revision: record.Revision, TrustedNativeUI: true, ServiceReadEnabled: true, Grants: manifest.Permissions}
	w = call("PUT", base+"/approval", at, a)
	require.Equal(t, 200, w.Code, w.Body.String())
	saved, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.True(t, saved.ServiceReadEnabled)
	require.NoError(t, domain.Authorize(*saved, "containers.read", 1))
	require.Error(t, domain.Authorize(*saved, "containers.read", 3))
	// Updating even the same package revokes all approval; stale requests cannot approve it.
	manifest.Version = "1.1.0"
	w = call("POST", "/native-extensions", at, manifest)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.Equal(t, 409, call("PUT", base+"/approval", at, a).Code)
	saved, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, 2, saved.Revision)
	require.Empty(t, saved.Grants)
	require.False(t, saved.TrustedNativeUI)
	require.False(t, saved.ServiceReadEnabled)
	require.Error(t, domain.Authorize(*saved, "containers.read", 1))
	a.Revision = 2
	a.Grants = []domain.Permission{{Capability: "containers.read", EnvironmentIDs: []int{3}}}
	a.TrustedNativeUI = false
	a.ServiceReadEnabled = false
	require.Equal(t, 400, call("PUT", base+"/approval", at, a).Code)
	a.Grants = []domain.Permission{{Capability: "containers.read", EnvironmentIDs: []int{1}}}
	require.Equal(t, 200, call("PUT", base+"/approval", at, a).Code)
	a.ServiceReadEnabled = true
	a.Grants = []domain.Permission{{Capability: "environments.read", EnvironmentIDs: []int{1}}}
	require.Equal(t, 200, call("PUT", base+"/approval", at, a).Code)
	require.Equal(t, 200, call("POST", base+"/disable", at, nil).Code)
	saved, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Empty(t, saved.Grants)
	require.False(t, saved.ServiceReadEnabled)
	require.Error(t, domain.Authorize(*saved, "containers.read", 1))
	require.Equal(t, http.StatusNoContent, call("DELETE", base, at, nil).Code)
	_, err = store.NativeExtension().Read(record.ID)
	require.True(t, store.IsErrObjectNotFound(err))
	logs, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	actions := map[string]int{}
	for _, l := range logs {
		actions[l.Action]++
	}
	require.Equal(t, 2, actions["extension.register"])
	require.Equal(t, 3, actions["extension.approve"])
	require.Equal(t, 1, actions["extension.disable"])
	require.Equal(t, 1, actions["extension.remove"])
}
