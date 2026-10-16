package topology

import (
	"context"
	"errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

// AuthorizeUser mirrors stack inspection using fresh persisted role and team
// memberships, never a delegated browser token or cached authorization snapshot.
func AuthorizeUser(ctx context.Context, store dataservices.DataStore, userID, environmentID, stackID int) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	stack, err := store.Stack().Read(portainer.StackID(stackID))
	if err != nil {
		return errors.New("stack unavailable")
	}
	if int(stack.EndpointID) != environmentID || stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack {
		return errors.New("stack is outside requested Docker environment")
	}
	user, err := store.User().Read(portainer.UserID(userID))
	if err != nil {
		return errors.New("current user unavailable")
	}
	endpoint, err := store.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return errors.New("environment unavailable")
	}
	memberships, err := store.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return err
	}
	if user.Role != portainer.AdministratorRole {
		group, err := store.EndpointGroup().Read(endpoint.GroupID)
		if err != nil {
			return err
		}
		if !security.AuthorizedEndpointAccess(endpoint, group, user.ID, memberships) {
			return errors.New("environment access denied")
		}
	}
	control, err := store.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return err
	}
	if control != nil && authorization.UserCanReadResource(user.ID, authorization.TeamIDs(memberships), control) {
		return nil
	}
	if stackutils.UserIsAdminOrEndpointAdmin(user) {
		return nil
	}
	return errors.New("stack read access denied")
}
