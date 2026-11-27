package delivery

import (
	"context"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	domain "github.com/portainer/portainer/api/nativeextensions"
)

type authorizationKey struct{}

// Authorization binds the host's reviewed request through the actual stack write
// transaction, so revocation during repository/registry I/O blocks deployment.
type Authorization struct {
	RegistrationID, Revision, EnvironmentID, StackID, UserID, AutomationVersion int
	PackageDigest, Capability                                                   string
}

func WithAuthorization(ctx context.Context, binding Authorization) context.Context {
	return context.WithValue(ctx, authorizationKey{}, binding)
}
func CheckAuthorizationTx(ctx context.Context, tx dataservices.DataStoreTx) error {
	binding, ok := ctx.Value(authorizationKey{}).(Authorization)
	if !ok {
		return nil
	}
	record, err := tx.NativeExtension().Read(binding.RegistrationID)
	if err != nil {
		return domain.ErrDenied
	}
	user, err := tx.User().Read(portainer.UserID(binding.UserID))
	if err != nil || user.Role != portainer.AdministratorRole {
		return domain.ErrDenied
	}
	if record.Revision != binding.Revision || record.Manifest.PackageDigest != binding.PackageDigest || domain.Authorize(*record, "ui.native", 0) != nil || domain.AuthorizeStackCapability(*record, binding.Capability, binding.EnvironmentID, binding.StackID) != nil {
		return domain.ErrDenied
	}
	if binding.AutomationVersion > 0 {
		policy := record.ImageAutomation
		if policy == nil || !policy.Enabled || policy.Mode != "automatic" || policy.Version != binding.AutomationVersion || policy.ConfiguredBy != binding.UserID || policy.EnvironmentID != binding.EnvironmentID || policy.StackID != binding.StackID || domain.AuthorizeStackCapability(*record, "stacks.images.auto-update", binding.EnvironmentID, binding.StackID) != nil {
			return domain.ErrDenied
		}
	}
	return nil
}
