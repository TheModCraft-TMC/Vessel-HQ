package stacks

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/nativeextensions/delivery"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"io"
	"net/http"
	"strconv"
)

// RedeployFromExtension accepts no extension-supplied Compose, environment variables,
// credentials or repository overrides. The normal stack handler still authorizes
// the user and performs deployment, Vault resolution and scheduler reconciliation.
func (h *Handler) RedeployFromExtension(w http.ResponseWriter, r *http.Request, environmentID, stackID int, version string, repull bool) *httperror.HandlerError {
	user, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil || !user.IsAdmin {
		return httperror.Forbidden("Administrator required", nil)
	}
	stack, err := h.DataStore.Stack().Read(portainer.StackID(stackID))
	if err != nil {
		return httperror.NotFound("Stack unavailable", nil)
	}
	if int(stack.EndpointID) != environmentID || (stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack) {
		return httperror.Forbidden("Stack scope denied", nil)
	}
	review, readErr := delivery.Read(r.Context(), h.DataStore, environmentID, stackID)
	if readErr != nil {
		return httperror.InternalServerError("Cannot verify stack review", nil)
	}
	if version == "" || review.Version != version {
		return httperror.Conflict("Stack changed; refresh before deploying", nil)
	}
	if stack.Status == portainer.StackStatusDeploying {
		return httperror.Conflict("Stack deployment already in progress", nil)
	}
	var payload any
	path := "/stacks/" + strconv.Itoa(stackID)
	if stack.WorkflowID != 0 {
		path += "/git/redeploy"
		payload = stackGitRedeployPayload{RepullImageAndRedeploy: repull}
	} else {
		if !repull {
			return httperror.BadRequest("Git synchronization requires a Git-backed stack", nil)
		}
		content, err := h.FileService.GetFileContent(stack.ProjectPath, stack.EntryPoint)
		if err != nil {
			return httperror.InternalServerError("Cannot read stored stack file", nil)
		}
		prune := false
		if stack.Option != nil {
			prune = stack.Option.Prune
		}
		payload = updateComposeStackPayload{StackFileContent: string(content), Env: stack.Env, Prune: prune, RepullImageAndRedeploy: true}
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return httperror.InternalServerError("Cannot prepare deployment", nil)
	}
	request := r.Clone(context.WithValue(r.Context(), extensionReviewKey{}, version))
	request.Method = http.MethodPut
	request.URL.Path = path
	request.URL.RawQuery = "endpointId=" + strconv.Itoa(environmentID)
	request.Body = io.NopCloser(bytes.NewReader(body))
	request.ContentLength = int64(len(body))
	request.Header = request.Header.Clone()
	request.Header.Set("Content-Type", "application/json")
	request = mux.SetURLVars(request, map[string]string{"id": strconv.Itoa(stackID)})
	if stack.WorkflowID != 0 {
		return h.stackGitRedeploy(w, request)
	}
	return h.stackUpdate(w, request)
}

type extensionReviewKey struct{}

func checkExtensionReview(tx dataservices.DataStoreTx, r *http.Request, stack *portainer.Stack) *httperror.HandlerError {
	if err := delivery.CheckAuthorizationTx(r.Context(), tx); err != nil {
		return httperror.Forbidden("Extension deployment authorization changed", nil)
	}
	expected, ok := r.Context().Value(extensionReviewKey{}).(string)
	if !ok {
		return nil
	}
	actual, err := delivery.ReviewVersionTx(tx, stack)
	if err != nil {
		return httperror.InternalServerError("Cannot verify stack review", nil)
	}
	if expected != actual {
		return httperror.Conflict("Stack or source changed; refresh before deploying", nil)
	}
	return nil
}
