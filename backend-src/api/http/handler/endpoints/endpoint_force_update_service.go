package endpoints

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/moby/moby/client"

	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/docker/images"
	"github.com/portainer/portainer/api/logs"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

type forceUpdateServicePayload struct {
	// ServiceId to update
	ServiceID string
	// PullImage if true will pull the image
	PullImage bool
}

func (payload *forceUpdateServicePayload) Validate(r *http.Request) error {
	if strings.TrimSpace(payload.ServiceID) == "" {
		return errors.New("ServiceID is required")
	}
	return nil
}

// forceUpdateServiceResponse is the endpoint's wire contract. The SDK result
// also serializes nil warnings as null; describe that explicitly for clients.
type forceUpdateServiceResponse struct {
	Warnings []string `json:"Warnings" extensions:"x-nullable"`
}

// @id endpointForceUpdateService
// @summary force update a docker service
// @description force update a docker service
// @description **Access policy**: authenticated
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "endpoint identifier"
// @param body body forceUpdateServicePayload true "details"
// @success 200 {object} forceUpdateServiceResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "endpoint not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/forceupdateservice [put]
func (handler *Handler) endpointForceUpdateService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	var payload forceUpdateServicePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portaineree.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to force update service", err)
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return httperror.InternalServerError("Error creating docker client", err)
	}
	closeClient := true
	defer func() {
		if closeClient {
			logs.CloseAndLogErr(dockerClient)
		}
	}()

	serviceResult, err := dockerClient.ServiceInspect(context.Background(), payload.ServiceID, client.ServiceInspectOptions{InsertDefaults: true})
	service := serviceResult.Service
	if err != nil {
		return httperror.InternalServerError("Error looking up service", err)
	}

	service.Spec.TaskTemplate.ForceUpdate++

	if payload.PullImage {
		service.Spec.TaskTemplate.ContainerSpec.Image = strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, "@sha")[0]
	}

	newService, err := dockerClient.ServiceUpdate(context.Background(), payload.ServiceID, client.ServiceUpdateOptions{Version: service.Version, Spec: service.Spec, QueryRegistry: true})
	if err != nil {
		return httperror.InternalServerError("Error force update service", err)
	}

	// The goroutine will close the client
	closeClient = false

	go func() {
		defer logs.CloseAndLogErr(dockerClient)

		images.EvictImageStatus(payload.ServiceID)
		images.EvictImageStatus(service.Spec.Labels[consts.SwarmStackNameLabel])

		// ignore errors from this cleanup function, log them instead
		containersResult, err := dockerClient.ContainerList(context.TODO(), client.ContainerListOptions{
			All:     true,
			Filters: make(client.Filters).Add("label", consts.SwarmServiceIDLabel+"="+payload.ServiceID),
		})
		containers := containersResult.Items
		if err != nil {
			log.Warn().Err(err).Str("Environment", endpoint.Name).Msg("Error listing containers")
		}

		for _, container := range containers {
			images.EvictImageStatus(container.ID)
		}
	}()

	return response.JSON(w, forceUpdateServiceResponse{Warnings: newService.Warnings})
}
