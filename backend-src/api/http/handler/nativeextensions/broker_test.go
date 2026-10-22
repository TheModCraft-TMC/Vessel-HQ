package nativeextensions

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	domain "github.com/portainer/portainer/api/nativeextensions"
	extensionrpc "github.com/portainer/portainer/api/nativeextensions/rpc"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"github.com/stretchr/testify/require"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBrowserBrokerRestrictsSlotsAndUsesDelegatedGRPC(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	user := &portainer.User{Username: "reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	service, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	token, _, err := service.GenerateToken(&portainer.TokenData{ID: user.ID, Role: user.Role})
	require.NoError(t, err)
	permissions := []domain.Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}, {Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	record := domain.Record{Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions, Manifest: domain.Manifest{ID: "org.example.topology", Name: "Topology", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("d", 64), Permissions: permissions, UI: &domain.UI{Entry: "ui/index.tsx", Slots: []domain.UISlot{{ID: "network", Title: "Networks", Slot: "docker.stack.detail.action"}}}}}
	require.NoError(t, store.NativeExtension().Create(&record))
	h := NewHandler(security.NewRequestBouncer(t.Context(), store, service, apikey.NewAPIKeyService(nil, nil)))
	h.DataStore = store
	h.AuthorizeUser = func(_ context.Context, id, env, stack int) error {
		if id != int(user.ID) || env != 1 || stack != 2 {
			return errors.New("no user access")
		}
		return nil
	}
	reads := 0
	audits := 0
	h.Broker, err = extensionrpc.NewInternalBroker(t.Context(), func(_ context.Context, id string) (domain.Record, error) {
		all, err := store.NativeExtension().ReadAll()
		if err != nil {
			return domain.Record{}, err
		}
		for _, record := range all {
			if record.Manifest.ID == id {
				return record, nil
			}
		}
		return domain.Record{}, errors.New("unknown")
	}, func(_ context.Context, env, stack int) (topology.Graph, error) {
		reads++
		return topology.Graph{EnvironmentID: env, StackID: stack, Name: "target", Networks: []topology.Network{}, Workloads: []topology.Workload{}}, nil
	}, h.AuthorizeUser, func(context.Context, extensionrpc.AccessEvent) error { audits++; return nil })
	require.NoError(t, err)
	call := func(method, path, auth string, payload any) *httptest.ResponseRecorder {
		var body bytes.Buffer
		if payload != nil {
			require.NoError(t, json.NewEncoder(&body).Encode(payload))
		}
		r := httptest.NewRequest(method, path, &body)
		if auth != "" {
			r.Header.Set("Authorization", "Bearer "+auth)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	require.Equal(t, 401, call("GET", "/native-extensions/slots?environmentId=1&stackId=2", "", nil).Code)
	require.Equal(t, 403, call("GET", "/native-extensions/slots?environmentId=1&stackId=9", token, nil).Code)
	w := call("GET", "/native-extensions/slots?environmentId=1&stackId=2", token, nil)
	require.Equal(t, 200, w.Code, w.Body.String())
	require.Contains(t, w.Body.String(), "docker.stack.detail.action")
	var available []slotRecord
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &available))
	require.Len(t, available, 1)
	require.Equal(t, "ui/index.tsx", available[0].Manifest.UI.Entry)
	require.NotContains(t, w.Body.String(), "grants")
	w = call("POST", "/native-extensions/1/invoke", token, invokePayload{Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.network.read", EnvironmentID: 1, StackID: 2})
	require.Equal(t, 200, w.Code, w.Body.String())
	require.Equal(t, 1, reads)
	require.Equal(t, 1, audits)
	require.Equal(t, 409, call("POST", "/native-extensions/1/invoke", token, invokePayload{Revision: record.Revision + 1, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.network.read", EnvironmentID: 1, StackID: 2}).Code)
	require.Equal(t, 409, call("POST", "/native-extensions/1/invoke", token, invokePayload{Revision: record.Revision, PackageDigest: "sha256:" + strings.Repeat("e", 64), Operation: "stacks.network.read", EnvironmentID: 1, StackID: 2}).Code)
	require.Equal(t, 400, call("POST", "/native-extensions/1/invoke", token, invokePayload{Operation: "stacks.network.read", EnvironmentID: 1, StackID: 2}).Code)
	require.Equal(t, 1, reads, "stale or unbound callers must never reach the gRPC broker")
	require.False(t, record.ServiceReadEnabled)
	w = call("POST", "/native-extensions/1/invoke", token, invokePayload{Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.network.read", EnvironmentID: 1, StackID: 9})
	require.Equal(t, 403, w.Code)
	require.Equal(t, 1, reads)
	logs, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	found := false
	for _, entry := range logs {
		if entry.Action == "extension.invoke.denied" {
			found = true
		}
	}
	require.True(t, found)
	require.Equal(t, 403, call("GET", "/native-extensions/1/package", token, nil).Code)
	record.Status = "disabled"
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	w = call("GET", "/native-extensions/slots?environmentId=1&stackId=2", token, nil)
	require.Equal(t, 200, w.Code)
	require.JSONEq(t, "[]", w.Body.String())
	w = call("POST", "/native-extensions/1/invoke", token, invokePayload{Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.network.read", EnvironmentID: 1, StackID: 2})
	require.Equal(t, 403, w.Code)
	require.Equal(t, 1, reads)
}
