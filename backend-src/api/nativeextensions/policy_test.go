package nativeextensions

import (
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func TestFailClosedPolicy(t *testing.T) {
	m := Manifest{ID: "org.example.demo", Name: "Demo", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: []Permission{{Capability: "containers.read", EnvironmentIDs: []int{7}}, {Capability: "ui.native"}}}
	require.NoError(t, m.Validate())
	r := Record{Manifest: m, Revision: 3, Status: "approved", Grants: m.Permissions, TrustedNativeUI: true}
	require.NoError(t, Authorize(r, "containers.read", 7))
	require.NoError(t, Authorize(r, "ui.native", 0))
	for _, c := range []struct {
		cap string
		env int
	}{{"containers.read", 0}, {"containers.read", 8}, {"containers.write", 7}, {"ui.native", 7}} {
		require.ErrorIs(t, Authorize(r, c.cap, c.env), ErrDenied)
	}
	r.TrustedNativeUI = false
	require.Error(t, Authorize(r, "ui.native", 0))
	r.Status = "disabled"
	require.Error(t, Authorize(r, "containers.read", 7))
	a := Approval{Revision: 3, Grants: []Permission{{Capability: "ui.native"}}}
	require.Error(t, a.ValidateFor(r))
	a.TrustedNativeUI = true
	require.NoError(t, a.ValidateFor(r))
	a.Revision = 2
	require.Error(t, a.ValidateFor(r))
	for _, ps := range [][]Permission{{{Capability: "*"}}, {{Capability: "containers.read"}}, {{Capability: "containers.read", EnvironmentIDs: []int{-1}}}, {{Capability: "containers.read", EnvironmentIDs: []int{1, 1}}}, {{Capability: "ui.native", EnvironmentIDs: []int{1}}}, {{Capability: "ui.native"}, {Capability: "ui.native"}}} {
		bad := m
		bad.Permissions = ps
		require.Error(t, bad.Validate())
	}
}

func TestServiceReadApprovalIsExplicitAndScoped(t *testing.T) {
	manifest := Manifest{ID: "org.example.metadata", Name: "Metadata", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("b", 64), Permissions: []Permission{{Capability: "environments.read", EnvironmentIDs: []int{2}}}}
	record := Record{Manifest: manifest, Revision: 4, Status: "pending_approval"}
	approval := Approval{Revision: 4, Grants: manifest.Permissions}
	require.False(t, approval.ServiceReadEnabled)
	require.NoError(t, approval.ValidateFor(record))
	approval.ServiceReadEnabled = true
	require.NoError(t, approval.ValidateFor(record))
	require.False(t, approval.TrustedNativeUI)
	approval.Grants = nil
	require.Error(t, approval.ValidateFor(record))
	approval.Grants = []Permission{{Capability: "containers.read", EnvironmentIDs: []int{2}}}
	require.Error(t, approval.ValidateFor(record))
	approval.Grants = manifest.Permissions
	approval.Revision = 3
	require.Error(t, approval.ValidateFor(record))
	approval.Revision = 4
	approval.Grants = []Permission{{Capability: "environments.read", EnvironmentIDs: []int{3}}}
	require.Error(t, approval.ValidateFor(record))
}

func TestStackNetworkPermissionRequiresBothResourceScopes(t *testing.T) {
	manifest := Manifest{ID: "org.example.topology", Name: "Topology", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("c", 64), Permissions: []Permission{{Capability: "ui.native", EnvironmentIDs: []int{}}, {Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}}
	record := Record{Manifest: manifest, Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: manifest.Permissions}
	require.NoError(t, manifest.Validate())
	require.NoError(t, AuthorizeStackNetwork(record, 1, 2))
	require.Error(t, AuthorizeStackNetwork(record, 1, 3))
	require.Error(t, AuthorizeStackNetwork(record, 2, 2))
	require.Error(t, Authorize(record, "stacks.network.read", 1))
	approval := Approval{Revision: 1, Grants: []Permission{{Capability: "stacks.network.read", EnvironmentIDs: []int{1}, StackIDs: []int{3}}}}
	require.Error(t, approval.ValidateFor(record))
	approval.Grants[0].StackIDs = []int{2}
	require.NoError(t, approval.ValidateFor(record))
	approval.Grants[0].StackIDs = nil
	require.Error(t, approval.ValidateFor(record))
	manifest.Permissions = []Permission{{Capability: "environments.read", EnvironmentIDs: []int{1}, StackIDs: []int{}}}
	require.Error(t, manifest.Validate())
}
