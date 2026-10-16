package topology

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestDelegationUsesCurrentEnvironmentAndStackReadAccess(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	user := &portainer.User{Username: "reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	endpoint := &portainer.Endpoint{Name: "Docker", Type: portainer.DockerEnvironment, GroupID: 1, UserAccessPolicies: portainer.UserAccessPolicies{user.ID: {RoleID: 1}}}
	require.NoError(t, store.Endpoint().Create(endpoint))
	stack := &portainer.Stack{Name: "target", Type: portainer.DockerComposeStack, EndpointID: endpoint.ID}
	require.NoError(t, store.Stack().Create(stack))
	require.Error(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID), int(stack.ID)))
	control := &portainer.ResourceControl{ResourceID: stackutils.ResourceControlID(endpoint.ID, stack.Name), Type: portainer.StackResourceControl, UserAccesses: []portainer.UserResourceAccess{{UserID: user.ID, AccessLevel: portainer.ReadOnlyAccessLevel}}}
	require.NoError(t, store.ResourceControl().Create(control))
	require.NoError(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID), int(stack.ID)))
	require.Error(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID)+1, int(stack.ID)))
	// Removing read access is effective on the next callback, even for a lease
	// signed while the earlier grant was valid.
	control.UserAccesses = nil
	require.NoError(t, store.ResourceControl().Update(control.ID, control))
	require.Error(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID), int(stack.ID)))
	user.Role = portainer.AdministratorRole
	require.NoError(t, store.User().Update(user.ID, user))
	require.NoError(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID), int(stack.ID)))
	user.Role = portainer.StandardUserRole
	require.NoError(t, store.User().Update(user.ID, user))
	require.Error(t, AuthorizeUser(t.Context(), store, int(user.ID), int(endpoint.ID), int(stack.ID)))
}
