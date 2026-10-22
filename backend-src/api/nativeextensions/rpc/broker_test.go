package rpc

import (
	"context"
	"errors"
	v1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	"github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net"
	"strings"
	"sync"
	"testing"
	"time"
)

func topologyRecord() nativeextensions.Record {
	permissions := []nativeextensions.Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}, {Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	return nativeextensions.Record{ID: 3, Revision: 1, Status: "approved", TrustedNativeUI: true, Manifest: nativeextensions.Manifest{ID: "org.example.topology", Name: "Topology", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: permissions}, Grants: permissions}
}
func TestInternalBrokerUsesRealMTLSAndFreshDelegation(t *testing.T) {
	var mu sync.Mutex
	record := topologyRecord()
	userAllowed := true
	calls := 0
	auditFails := false
	revokeDuringRead := false
	events := []AccessEvent{}
	lookup := func(context.Context, string) (nativeextensions.Record, error) {
		mu.Lock()
		defer mu.Unlock()
		return record, nil
	}
	authorize := func(_ context.Context, user, env, stack int) error {
		mu.Lock()
		defer mu.Unlock()
		if user != 7 || env != 1 || stack != 2 || !userAllowed {
			return errors.New("user access denied")
		}
		return nil
	}
	read := func(_ context.Context, env, stack int) (topology.Graph, error) {
		mu.Lock()
		defer mu.Unlock()
		calls++
		if revokeDuringRead {
			record.Status = "disabled"
		}
		return topology.Graph{EnvironmentID: env, StackID: stack, Name: "target", Networks: []topology.Network{{ID: "network", Name: "app"}}, Workloads: []topology.Workload{}}, nil
	}
	audit := func(_ context.Context, event AccessEvent) error {
		mu.Lock()
		defer mu.Unlock()
		if auditFails {
			return errors.New("audit unavailable")
		}
		events = append(events, event)
		return nil
	}
	broker, err := NewInternalBroker(t.Context(), lookup, read, authorize, audit)
	require.NoError(t, err)
	original := record
	result, err := broker.Invoke(t.Context(), original, 7, 1, 2)
	require.NoError(t, err)
	require.Equal(t, "target", result.Name)
	require.Equal(t, 1, calls)
	require.False(t, original.ServiceReadEnabled, "user delegation does not require unattended machine authority")
	_, err = broker.Invoke(t.Context(), original, 7, 1, 9)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	require.Equal(t, 1, calls)
	mu.Lock()
	userAllowed = false
	mu.Unlock()
	_, err = broker.Invoke(t.Context(), original, 7, 1, 2)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	require.Equal(t, 1, calls)
	mu.Lock()
	userAllowed = true
	revokeDuringRead = true
	mu.Unlock()
	_, err = broker.Invoke(t.Context(), original, 7, 1, 2)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	require.Equal(t, 2, calls)
	mu.Lock()
	record = original
	revokeDuringRead = false
	auditFails = true
	mu.Unlock()
	_, err = broker.Invoke(t.Context(), original, 7, 1, 2)
	require.Equal(t, codes.Internal, status.Code(err))
	// A plaintext gRPC channel cannot call the private server, even with plausible
	// extension metadata. The test does not fabricate a TLS peer context.
	connection, err := grpc.NewClient("passthrough:///extensions.internal", grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) { return broker.listener.DialContext(ctx) }), grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	defer connection.Close()
	ctx, cancel := context.WithTimeout(t.Context(), time.Second)
	defer cancel()
	_, err = v1.NewExtensionGatewayClient(connection).GetStackNetwork(ctx, &v1.GetStackNetworkRequest{EnvironmentId: 1, StackId: 2})
	require.Error(t, err)
	require.NotEmpty(t, events)
	require.Equal(t, 7, events[0].UserID)
	require.Equal(t, 2, events[0].StackID)
}
func TestDelegatedLeaseCannotChangeIdentityOrScope(t *testing.T) {
	signer, err := newLeaseSigner()
	require.NoError(t, err)
	lease, err := signer.sign("org.example.topology", "sha256:"+strings.Repeat("a", 64), 7, 1, 2)
	require.NoError(t, err)
	ctx := metadata.NewIncomingContext(t.Context(), metadata.Pairs(leaseHeader, lease))
	id, err := signer.verify(ctx, "org.example.topology", "sha256:"+strings.Repeat("a", 64), 1, 2)
	require.NoError(t, err)
	require.Equal(t, 7, id)
	_, err = signer.verify(ctx, "org.other.extension", "sha256:"+strings.Repeat("a", 64), 1, 2)
	require.Error(t, err)
	_, err = signer.verify(ctx, "org.example.topology", "sha256:"+strings.Repeat("a", 64), 1, 3)
	require.Error(t, err)
	_, err = signer.verify(ctx, "org.example.topology", "sha256:"+strings.Repeat("b", 64), 1, 2)
	require.Error(t, err)
	other, err := newLeaseSigner()
	require.NoError(t, err)
	_, err = other.verify(ctx, "org.example.topology", "sha256:"+strings.Repeat("a", 64), 1, 2)
	require.Error(t, err)
}
