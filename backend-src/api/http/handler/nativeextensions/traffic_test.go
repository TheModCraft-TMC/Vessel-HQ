package nativeextensions

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	rpc "github.com/portainer/portainer/api/nativeextensions/rpc"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"github.com/stretchr/testify/require"
)

type cancelOnFlush struct {
	*httptest.ResponseRecorder
	cancel context.CancelFunc
	once   sync.Once
}

func (w *cancelOnFlush) Flush() { w.ResponseRecorder.Flush(); w.once.Do(w.cancel) }

func TestTrafficStreamScopesBeforeStreamingAndStopsWithRequest(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	user := &portainer.User{Username: "traffic-reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	sign, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	token, _, err := sign.GenerateToken(&portainer.TokenData{ID: user.ID, Role: user.Role})
	require.NoError(t, err)
	permissions := []domain.Permission{{Capability: "ui.native"}, {Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}, {Capability: "stacks.traffic.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	record := domain.Record{Manifest: domain.Manifest{ID: "org.example.traffic", Name: "Traffic", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("d", 64), Permissions: permissions}, Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions[:2]}
	require.NoError(t, store.NativeExtension().Create(&record))
	h := NewHandler(security.NewRequestBouncer(t.Context(), store, sign, apikey.NewAPIKeyService(nil, nil)))
	h.DataStore = store
	h.AuthorizeUser = func(_ context.Context, _ int, env, stack int) error {
		if env != 1 || stack != 2 {
			return errors.New("denied")
		}
		return nil
	}
	reads := 0
	h.Broker, err = rpc.NewInternalBroker(t.Context(), func(context.Context, string) (domain.Record, error) {
		r, e := store.NativeExtension().Read(record.ID)
		if e != nil {
			return domain.Record{}, e
		}
		return *r, nil
	}, func(context.Context, int, int) (topology.Graph, error) { return topology.Graph{}, nil }, h.AuthorizeUser, func(context.Context, rpc.AccessEvent) error { return nil }, func(context.Context, int, int) (topology.Graph, error) {
		reads++
		return topology.Graph{EnvironmentID: 1, StackID: 2, Traffic: &topology.TrafficSnapshot{CollectedAt: "2026-10-16T00:00:00Z"}}, nil
	})
	require.NoError(t, err)
	request := func(ctx context.Context) *httptest.ResponseRecorder {
		payload := invokePayload{Operation: "stacks.traffic.read", EnvironmentID: 1, StackID: 2, Revision: 1, PackageDigest: record.Manifest.PackageDigest}
		body, err := json.Marshal(payload)
		require.NoError(t, err)
		r := httptest.NewRequest("POST", "/native-extensions/1/traffic-stream", bytes.NewReader(body)).WithContext(ctx)
		r.Header.Set("Authorization", "Bearer "+token)
		response := httptest.NewRecorder()
		cancelCtx, cancel := context.WithCancel(ctx)
		defer cancel()
		r = r.WithContext(cancelCtx)
		h.ServeHTTP(&cancelOnFlush{ResponseRecorder: response, cancel: cancel}, r)
		return response
	}
	w := request(t.Context())
	require.Equal(t, 403, w.Code)
	require.Zero(t, reads)
	require.NotContains(t, w.Body.String(), "event: snapshot")
	record.Grants = permissions
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	w = request(t.Context())
	require.Equal(t, 200, w.Code)
	require.Equal(t, "text/event-stream", w.Header().Get("Content-Type"))
	require.Equal(t, "no-store, no-transform", w.Header().Get("Cache-Control"))
	require.Contains(t, w.Body.String(), "event: snapshot")
	require.Contains(t, w.Body.String(), "event: end")
	require.Equal(t, 1, reads)
	record.Status = "disabled"
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	w = request(t.Context())
	require.Equal(t, 403, w.Code)
	require.Equal(t, 1, reads)
}
