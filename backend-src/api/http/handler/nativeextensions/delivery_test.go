package nativeextensions

import (
	"bytes"
	"context"
	"encoding/json"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/delivery"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestDeliveryBrokerBindingAdminAndResponseRedaction(t *testing.T) {
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
	permissions := []domain.Permission{{Capability: "ui.native"}, {Capability: "stacks.delivery.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}, {Capability: "stacks.gitops.sync", EnvironmentIDs: []int{1}, StackIDs: []int{2}}, {Capability: "stacks.images.update", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	record := domain.Record{Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions, Manifest: domain.Manifest{ID: "org.example.delivery", Name: "Delivery", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: permissions}}
	for _, capability := range []string{"stacks.images.read", "stacks.images.configure", "stacks.images.auto-update"} {
		permission := domain.Permission{Capability: capability, EnvironmentIDs: []int{1}, StackIDs: []int{2}}
		record.Manifest.Permissions = append(record.Manifest.Permissions, permission)
		record.Grants = append(record.Grants, permission)
	}
	require.NoError(t, store.NativeExtension().Create(&record))
	h := NewHandler(security.NewRequestBouncer(t.Context(), store, auth, apikey.NewAPIKeyService(nil, nil)))
	h.DataStore = store
	h.AuthorizeUser = func(_ context.Context, _ int, env, stack int) error {
		if env != 1 || stack != 2 {
			return domain.ErrDenied
		}
		return nil
	}
	policy := "manual"
	h.DeliveryRead = func(context.Context, int, int, bool) (delivery.Snapshot, error) {
		return delivery.Snapshot{EnvironmentID: 1, StackID: 2, Version: "review", Images: []delivery.Image{{Policy: policy, Status: "outdated"}}}, nil
	}
	writes := 0
	h.Redeploy = func(w http.ResponseWriter, r *http.Request, env, stack int, version string, repull bool) *httperror.HandlerError {
		writes++
		identity, identityErr := security.RetrieveTokenData(r)
		require.NoError(t, identityErr)
		require.Equal(t, portainer.AdministratorRole, identity.Role)
		require.Equal(t, "review", version)
		_, _ = w.Write([]byte(`{"Env":["private-secret"]}`))
		return nil
	}
	payload := invokePayload{Revision: 1, PackageDigest: record.Manifest.PackageDigest, EnvironmentID: 1, StackID: 2, Operation: "stacks.gitops.sync", Version: "review"}
	call := func(token string, p invokePayload) *httptest.ResponseRecorder {
		body, _ := json.Marshal(p)
		r := httptest.NewRequest("POST", "/native-extensions/1/invoke", bytes.NewReader(body))
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	require.Equal(t, 401, call("", payload).Code)
	require.Equal(t, 403, call(readerToken, payload).Code)
	stale := payload
	stale.Revision = 2
	require.Equal(t, 409, call(token, stale).Code)
	outside := payload
	outside.StackID = 3
	require.Equal(t, 403, call(token, outside).Code)
	require.Zero(t, writes)
	result := call(token, payload)
	require.Equal(t, 200, result.Code, result.Body.String())
	require.Contains(t, result.Body.String(), "accepted")
	require.NotContains(t, result.Body.String(), "private-secret")
	require.Equal(t, "no-store", result.Header().Get("Cache-Control"))
	require.Equal(t, 1, writes)
	payload.Operation = "stacks.images.update"
	policy = "monitor-only"
	require.Equal(t, 409, call(token, payload).Code)
	require.Equal(t, 1, writes)
	// A configured monitor checks without mutating; switching to automatic needs
	// a fresh policy version and current separately scoped grants.
	payload.Operation = "stacks.images.configure"
	payload.Automation = &domain.ImageAutomation{Enabled: true, Mode: "monitor-only", IntervalMinutes: 5}
	policy = "manual"
	require.Equal(t, 200, call(token, payload).Code)
	require.Equal(t, 409, call(token, payload).Code, "stale policy edits cannot overwrite configuration")
	now := time.Now()
	h.runImageAutomation(t.Context(), now)
	require.Equal(t, 1, writes)
	current, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, "update-available", current.ImageAutomation.LastOutcome)
	payload.Automation.Version = 1
	payload.Automation.Mode = "automatic"
	require.Equal(t, 200, call(token, payload).Code)
	h.runImageAutomation(t.Context(), now.Add(6*time.Minute))
	require.Equal(t, 2, writes)
	h.runImageAutomation(t.Context(), now.Add(7*time.Minute))
	require.Equal(t, 2, writes, "interval prevents immediate repeat")
	admin.Role = portainer.StandardUserRole
	require.NoError(t, store.User().Update(admin.ID, admin))
	h.runImageAutomation(t.Context(), now.Add(12*time.Minute))
	require.Equal(t, 2, writes, "demoted policy owner cannot deploy")
	admin.Role = portainer.AdministratorRole
	require.NoError(t, store.User().Update(admin.ID, admin))
	current, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	current.Grants = current.Grants[:len(current.Grants)-1]
	require.NoError(t, store.NativeExtension().Update(current.ID, current))
	h.runImageAutomation(t.Context(), now.Add(12*time.Minute))
	require.Equal(t, 2, writes, "revoked automatic grant stops the job")
	record.Status = "disabled"
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	require.Equal(t, 403, call(token, payload).Code)
}
