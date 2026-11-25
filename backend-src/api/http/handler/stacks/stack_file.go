package stacks

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/projectfiles"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type stackFileResponse struct {
	// Content of the Stack file
	StackFileContent string `json:"StackFileContent" example:"version: 3\n services:\n web:\n image:nginx"`
	// Revision of all declared project files; use as If-Match when updating.
	Revision string `json:"Revision,omitempty"`
}

// @id StackFileInspect
// @summary Retrieve the content of the Stack file for the specified stack
// @description Get Stack file content.
// @description **Access policy**: restricted
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @produce application/zip
// @param id path int true "Stack identifier"
// @param format query string false "Use project for a portable archive of declared Compose files" Enums(project)
// @success 200 {object} stackFileResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Stack not found"
// @failure 409 "Git settings changed, redeploy required"
// @failure 500 "Server error"
// @router /stacks/{id}/file [get]
func (handler *Handler) stackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}
	readOnly := false

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		if !securityContext.IsAdmin {
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	if endpoint != nil {
		err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
		if err != nil {
			return httperror.Forbidden("Permission denied to access environment", err)
		}

		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
			}

			access, err := handler.userCanReadStack(securityContext, resourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
			}
			if !access {
				return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
			}
			canWrite, err := handler.userCanAccessStack(securityContext, resourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to verify user authorizations to validate stack write access", err)
			}
			readOnly = !canWrite
		}
	}

	var gitConfig *gittypes.RepoConfig
	if stack.WorkflowID != 0 && !readOnly {
		if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
			gitConfig, _, err = loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
			if err != nil {
				return httperror.InternalServerError("Unable to load git config for stack", err)
			}
			return nil
		}); err != nil {
			return response.TxErrorResponse(err)
		}
	}

	if gitStackPendingRedeploy(stack, gitConfig) {
		return httperror.Conflict("Stack git settings have changed. Redeploy the stack to apply the new configuration.", errors.New("git settings updated without redeploy"))
	}

	if format := r.URL.Query().Get("format"); format != "" {
		if format != "project" || (stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack) {
			return httperror.BadRequest("Project export requires a Compose or Swarm stack", errors.New("unsupported export format or stack type"))
		}
		variables := make([]string, 0, len(stack.Env)+len(stack.SecretMappings))
		for _, variable := range stack.Env {
			variables = append(variables, variable.Name)
		}
		for _, secret := range stack.SecretMappings {
			variables = append(variables, secret.Name)
		}
		archive, err := projectfiles.Export(r.Context(), stack.ProjectPath, stack.EntryPoint, stack.AdditionalFiles, variables)
		if err != nil {
			return httperror.Conflict("Unable to export complete Compose project; check its files and retry", err)
		}
		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Length", strconv.Itoa(len(archive)))
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="vessel-stack-%d.zip"`, stack.ID))
		w.Header().Set("Cache-Control", "no-store")
		if _, err := w.Write(archive); err != nil {
			return httperror.InternalServerError("Unable to write project export", err)
		}
		return nil
	}

	snapshot, err := projectfiles.Read(r.Context(), stack.ProjectPath, stack.EntryPoint, stack.AdditionalFiles)
	if err != nil {
		// Preserve legacy inspection/recovery for projects that cannot use the
		// bounded portable workflow (for example an internal repository link).
		// Never attach a revision to bytes from a different read.
		if handler.FileService == nil {
			return httperror.Conflict("Unable to read complete stack project from disk", err)
		}
		content, readErr := handler.FileService.GetFileContent(stack.ProjectPath, stack.EntryPoint)
		if readErr != nil {
			return httperror.InternalServerError("Unable to retrieve Compose file from disk", readErr)
		}
		w.Header().Set("Cache-Control", "no-store")
		return response.JSON(w, &stackFileResponse{StackFileContent: string(content)})
	}
	w.Header().Set("ETag", fmt.Sprintf(`"%s"`, snapshot.Revision))
	w.Header().Set("Cache-Control", "no-store")
	return response.JSON(w, &stackFileResponse{StackFileContent: string(snapshot.Content), Revision: snapshot.Revision})
}

// gitStackPendingRedeploy returns true when the stack's git settings (URL or config file path)
// have been updated via "save settings" but the stack has not yet been redeployed to apply them.
// In that state the local clone is stale and the stack file cannot be read from disk.
func gitStackPendingRedeploy(stack *portainer.Stack, gitConfig *gittypes.RepoConfig) bool {
	if gitConfig == nil || stack.CurrentDeploymentInfo == nil {
		return false
	}

	return gitConfig.URL != stack.CurrentDeploymentInfo.RepositoryURL ||
		gitConfig.ConfigFilePath != stack.CurrentDeploymentInfo.ConfigFilePath
}
