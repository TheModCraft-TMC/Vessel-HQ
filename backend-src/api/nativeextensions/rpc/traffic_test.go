package rpc

import (
	"context"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestTrafficRPCRequiresItsOwnGrantAndPreservesCounterPrecision(t *testing.T) {
	permissions := []nativeextensions.Permission{{Capability: "ui.native"}, {Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}, {Capability: "stacks.traffic.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	record := nativeextensions.Record{Manifest: nativeextensions.Manifest{ID: "org.example.traffic", Name: "Traffic", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("d", 64), Permissions: permissions}, Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions[:2]}
	reads := 0
	broker, err := NewInternalBroker(t.Context(), func(context.Context, string) (nativeextensions.Record, error) { return record, nil }, func(context.Context, int, int) (topology.Graph, error) { return topology.Graph{}, nil }, func(context.Context, int, int, int) error { return nil }, func(context.Context, AccessEvent) error { return nil }, func(_ context.Context, env, stack int) (topology.Graph, error) {
		reads++
		return topology.Graph{EnvironmentID: env, StackID: stack, Traffic: &topology.TrafficSnapshot{CollectedAt: "2026-10-16T00:00:00Z", Counters: []topology.NetworkCounter{{WorkloadID: "w", Available: true, ReceivedBytes: 9007199254740993, SentBytes: 42}}}}, nil
	})
	require.NoError(t, err)
	_, err = broker.InvokeTraffic(t.Context(), record, 1, 1, 2)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	require.Zero(t, reads)
	record.Grants = permissions
	graph, err := broker.InvokeTraffic(t.Context(), record, 1, 1, 2)
	require.NoError(t, err)
	require.Equal(t, 1, reads)
	require.EqualValues(t, uint64(9007199254740993), graph.Traffic.Counters[0].ReceivedBytes)
	require.NotNil(t, graph.Traffic.Routers)
	require.Empty(t, graph.Traffic.Routers)
	require.NotNil(t, graph.Traffic.Services)
	require.NotNil(t, graph.Traffic.Middlewares)
	require.NotNil(t, graph.Traffic.Warnings)
	_, err = broker.InvokeTraffic(t.Context(), record, 1, 1, 9)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	require.Equal(t, 1, reads)
}
