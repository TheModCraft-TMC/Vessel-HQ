package nativeextensions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
)

func TestRuntimeBudgetIsBoundedAndExpires(t *testing.T) {
	var budget runtimeBudget
	now := time.Now()
	for range 120 {
		allowed, exceeded := budget.allow("one", now)
		require.True(t, allowed)
		require.False(t, exceeded)
	}
	allowed, exceeded := budget.allow("one", now)
	require.False(t, allowed)
	require.True(t, exceeded)
	allowed, exceeded = budget.allow("other", now)
	require.True(t, allowed)
	require.False(t, exceeded)
	for i := len(budget.windows); i < 512; i++ {
		budget.allow(fmt.Sprint(i), now)
	}
	allowed, exceeded = budget.allow("capacity", now)
	require.False(t, allowed)
	require.False(t, exceeded, "capacity pressure must not disable an innocent extension")
	allowed, exceeded = budget.allow("one", now.Add(time.Minute))
	require.True(t, allowed)
	require.False(t, exceeded)
	require.Len(t, budget.windows, 1)
}

func TestRuntimeStreamsReleaseCapacity(t *testing.T) {
	var budget runtimeBudget
	releases := []func(){}
	for range 4 {
		release, ok := budget.retainStream("one")
		require.True(t, ok)
		releases = append(releases, release)
	}
	_, ok := budget.retainStream("one")
	require.False(t, ok)
	other, ok := budget.retainStream("other")
	require.True(t, ok)
	other()
	releases[0]()
	release, ok := budget.retainStream("one")
	require.True(t, ok)
	release()
	for _, release := range releases[1:] {
		release()
	}
	require.Empty(t, budget.streams)
}

func TestSafetyTripBindsApprovalRevokesAndPreservesData(t *testing.T) {
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
	broadcasts := 0
	h.PublishSafetyTrip = func() { broadcasts++ }
	record := domain.Record{Revision: 2, UpdatedAt: 10, Status: "approved", TrustedNativeUI: true, ServiceReadEnabled: true, Manifest: domain.Manifest{ID: "org.example.safe", Name: "Safety", Version: "1.0.0", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: []domain.Permission{{Capability: "ui.native"}, {Capability: "storage.read"}}}, Grants: []domain.Permission{{Capability: "ui.native"}}, Note: &domain.Note{Text: "keep", Version: 4}, ImageAutomation: &domain.ImageAutomation{Enabled: true, Version: 3}}
	require.NoError(t, record.Manifest.Validate())
	require.NoError(t, domain.Authorize(record, "ui.native", 0))
	require.NoError(t, store.NativeExtension().Create(&record))
	report := safetyTripRequest{Revision: 2, UpdatedAt: 10, PackageDigest: record.Manifest.PackageDigest, Reason: "restart-loop"}
	call := func(credential string, input safetyTripRequest) *httptest.ResponseRecorder {
		data, err := json.Marshal(input)
		require.NoError(t, err)
		r := httptest.NewRequest("POST", fmt.Sprintf("/native-extensions/%d/safety-trip", record.ID), bytes.NewReader(data))
		r.Header.Set("Authorization", "Bearer "+credential)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	require.Equal(t, 403, call(readerToken, report).Code)
	stale := report
	stale.UpdatedAt = 9
	require.Equal(t, 409, call(token, stale).Code)
	bad := report
	bad.Reason = "arbitrary private value"
	require.Equal(t, 400, call(token, bad).Code)
	require.Equal(t, 200, call(token, report).Code)
	saved, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, "disabled", saved.Status)
	require.Empty(t, saved.Grants)
	require.False(t, saved.TrustedNativeUI)
	require.False(t, saved.ServiceReadEnabled)
	require.False(t, saved.ImageAutomation.Enabled)
	require.Equal(t, 4, saved.ImageAutomation.Version)
	require.Equal(t, record.Note, saved.Note)
	require.Equal(t, "restart-loop", saved.SafetyReason)
	require.Equal(t, 1, broadcasts)
	require.Equal(t, 200, call(token, report).Code)
	require.Equal(t, 1, broadcasts, "duplicate reports must not broadcast")
	// A newly reviewed approval cannot be revoked by the old tab's report.
	saved.Status = "approved"
	saved.TrustedNativeUI = true
	saved.Grants = []domain.Permission{{Capability: "ui.native"}, {Capability: "storage.read"}}
	saved.SafetyReason = ""
	saved.UpdatedAt++
	require.NoError(t, store.NativeExtension().Update(saved.ID, saved))
	require.Equal(t, 409, call(token, report).Code)

	// A restricted caller is throttled without revoking anyone else's access.
	h.runtimeRequests.windows = map[string]runtimeWindow{
		fmt.Sprintf("%d:%d:%d", record.ID, record.Revision, reader.ID): {started: time.Now(), count: 120},
	}
	input, err := json.Marshal(invokePayload{Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.network.read", EnvironmentID: 15, StackID: 334})
	require.NoError(t, err)
	request := httptest.NewRequest("POST", fmt.Sprintf("/native-extensions/%d/invoke", record.ID), bytes.NewReader(input))
	request.Header.Set("Authorization", "Bearer "+readerToken)
	response := httptest.NewRecorder()
	h.ServeHTTP(response, request)
	require.Equal(t, 429, response.Code)
	saved, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, "approved", saved.Status)

	// Server-side enforcement also catches calls bypassing the browser guard.
	h.runtimeRequests.windows = map[string]runtimeWindow{
		fmt.Sprintf("%d:%d:%d", record.ID, record.Revision, admin.ID): {started: time.Now(), count: 120},
	}
	request = httptest.NewRequest("GET", fmt.Sprintf("/native-extensions/%d/storage?revision=%d&packageDigest=%s", record.ID, record.Revision, record.Manifest.PackageDigest), nil)
	request.Header.Set("Authorization", "Bearer "+token)
	response = httptest.NewRecorder()
	h.ServeHTTP(response, request)
	require.Equal(t, 429, response.Code)
	require.Equal(t, "60", response.Header().Get("Retry-After"))
	saved, err = store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Equal(t, "disabled", saved.Status)
	require.Equal(t, "request-rate", saved.SafetyReason)
	require.Equal(t, record.Note, saved.Note)
}
