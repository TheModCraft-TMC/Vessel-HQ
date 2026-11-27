package nativeextensions

import (
	"encoding/base64"
	"encoding/json"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/delivery"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"net/http"
	"time"
)

// These host operations are deliberately separate from the read-only SDK gRPC
// service. They cannot be delegated to unattended extension identities.
func (h *Handler) invokeDelivery(w http.ResponseWriter, r *http.Request, p invokePayload) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	user, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil || !user.IsAdmin || user.User == nil {
		return httperror.Forbidden("Administrator required", nil)
	}
	persisted, err := h.DataStore.User().Read(user.UserID)
	if err != nil || persisted.Role != portainer.AdministratorRole {
		return httperror.Forbidden("Current administrator required", nil)
	}
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil || id <= 0 || p.Revision <= 0 || p.PackageDigest == "" || p.EnvironmentID <= 0 || p.StackID <= 0 {
		return httperror.BadRequest("Invalid operation binding", nil)
	}
	record, err := h.DataStore.NativeExtension().Read(id)
	if err != nil {
		return httperror.NotFound("Extension unavailable", nil)
	}
	if record.Revision != p.Revision || record.Manifest.PackageDigest != p.PackageDigest {
		return httperror.Conflict("Extension changed; reload before continuing", nil)
	}
	if domain.Authorize(*record, "ui.native", 0) != nil || domain.AuthorizeStackCapability(*record, p.Operation, p.EnvironmentID, p.StackID) != nil || h.AuthorizeUser == nil || h.AuthorizeUser(r.Context(), int(user.UserID), p.EnvironmentID, p.StackID) != nil {
		return httperror.Forbidden("Extension or stack access denied", nil)
	}
	audit := func(outcome string) error {
		bytes, _ := json.Marshal(map[string]any{"extensionId": record.Manifest.ID, "revision": record.Revision, "packageDigest": record.Manifest.PackageDigest, "operation": p.Operation, "environmentId": p.EnvironmentID, "stackId": p.StackID, "outcome": outcome})
		return h.DataStore.ActivityLog().Create(&portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: user.User.Username, Action: "extension.delivery." + outcome, Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(bytes)})
	}
	if p.Operation == "stacks.images.configure" {
		return h.configureImageAutomation(w, r, p, *record)
	}
	if p.Operation == "stacks.delivery.read" || p.Operation == "stacks.images.read" {
		if h.DeliveryRead == nil {
			return httperror.NewError(503, "Stack delivery adapter unavailable", nil)
		}
		if err := audit("read"); err != nil {
			return httperror.InternalServerError("Cannot audit extension read", nil)
		}
		snapshot, err := h.DeliveryRead(r.Context(), p.EnvironmentID, p.StackID, p.Operation == "stacks.images.read")
		if err != nil {
			return httperror.InternalServerError("Cannot read stack delivery status", nil)
		}
		snapshot.Automation = record.ImageAutomation
		return response.JSON(w, snapshot)
	}
	if h.Redeploy == nil {
		return httperror.NewError(503, "Deployment adapter unavailable", nil)
	}
	if p.Version == "" {
		return httperror.BadRequest("Refresh the stack before deployment", nil)
	}
	if !h.deploymentMutex.TryLock() {
		return httperror.Conflict("Another extension deployment is in progress", nil)
	}
	defer h.deploymentMutex.Unlock()
	if p.Operation == "stacks.images.update" {
		if h.DeliveryRead == nil {
			return httperror.NewError(503, "Image policy adapter unavailable", nil)
		}
		snapshot, err := h.DeliveryRead(r.Context(), p.EnvironmentID, p.StackID, true)
		if err != nil {
			return httperror.InternalServerError("Cannot verify current image policy", nil)
		}
		if len(snapshot.Images) == 0 {
			return httperror.Conflict("No stack workloads available", nil)
		}
		_, automaticRun := r.Context().Value(automationContextKey{}).(automationBinding)
		freshOutdated := false
		for _, image := range snapshot.Images {
			if image.Status == "outdated" {
				freshOutdated = true
			}
			if automaticRun && image.Status != "updated" && image.Status != "outdated" {
				return httperror.Conflict("Automatic update requires complete current registry checks", nil)
			}
			if image.Policy != "manual" {
				return httperror.Conflict("Excluded or monitor-only workloads block stack-wide updates", nil)
			}
		}
		if automaticRun && !freshOutdated {
			return httperror.Conflict("Images changed; no current update available", nil)
		}
	}

	current, err := h.DataStore.NativeExtension().Read(id)
	if err != nil || current.Revision != record.Revision || current.Manifest.PackageDigest != record.Manifest.PackageDigest || domain.Authorize(*current, "ui.native", 0) != nil || domain.AuthorizeStackCapability(*current, p.Operation, p.EnvironmentID, p.StackID) != nil {
		return httperror.Forbidden("Extension approval changed", nil)
	}
	freshUser, userErr := h.DataStore.User().Read(user.UserID)
	if userErr != nil || freshUser.Role != portainer.AdministratorRole || h.AuthorizeUser(r.Context(), int(user.UserID), p.EnvironmentID, p.StackID) != nil {
		return httperror.Forbidden("Current administrator or stack access changed", nil)
	}
	if automatic, ok := r.Context().Value(automationContextKey{}).(automationBinding); ok {
		if current.ImageAutomation == nil || !current.ImageAutomation.Enabled || current.ImageAutomation.Mode != "automatic" || current.ImageAutomation.Version != automatic.Version || current.ImageAutomation.ConfiguredBy != int(user.UserID) || domain.AuthorizeStackCapability(*current, "stacks.images.auto-update", p.EnvironmentID, p.StackID) != nil {
			return httperror.Forbidden("Automatic update authorization changed", nil)
		}
	}
	if err := audit("requested"); err != nil {
		return httperror.InternalServerError("Cannot audit deployment request", nil)
	}
	// Never forward the stack handler's response: it contains deployment inputs.
	binding := delivery.Authorization{RegistrationID: record.ID, Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Capability: p.Operation, EnvironmentID: p.EnvironmentID, StackID: p.StackID, UserID: int(user.UserID)}
	if automatic, ok := r.Context().Value(automationContextKey{}).(automationBinding); ok {
		binding.AutomationVersion = automatic.Version
	}
	r = r.WithContext(delivery.WithAuthorization(r.Context(), binding))
	sink := &discardDeploymentResponse{header: http.Header{}}
	if err := h.Redeploy(sink, r, p.EnvironmentID, p.StackID, p.Version, p.Operation == "stacks.images.update"); err != nil {
		_ = audit("failed")
		code := err.StatusCode
		if code < 400 {
			code = 500
		}
		return httperror.NewError(code, "Stack deployment was not accepted; refresh status before retrying", nil)
	}
	if sink.status >= 400 {
		_ = audit("failed")
		return httperror.NewError(sink.status, "Stack deployment was not accepted", nil)
	}
	if err := audit("accepted"); err != nil {
		return httperror.InternalServerError("Deployment accepted but outcome audit failed; refresh status before retrying", nil)
	}
	return response.JSON(w, map[string]any{"accepted": true, "stackId": p.StackID, "environmentId": p.EnvironmentID})
}

type discardDeploymentResponse struct {
	header http.Header
	status int
}

func (d *discardDeploymentResponse) Header() http.Header    { return d.header }
func (d *discardDeploymentResponse) WriteHeader(status int) { d.status = status }
func (d *discardDeploymentResponse) Write(bytes []byte) (int, error) {
	if d.status == 0 {
		d.status = 200
	}
	return len(bytes), nil
}
