package azure

import (
	"errors"
	"io"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
)

// proxy for /subscriptions/*/resourceGroups/*/providers/Microsoft.ContainerInstance/containerGroups/*
func (transport *Transport) proxyContainerGroupRequest(request *http.Request) (*http.Response, error) {
	switch request.Method {
	case http.MethodPut:
		return transport.proxyContainerGroupPutRequest(request)
	case http.MethodGet:
		return transport.proxyContainerGroupGetRequest(request)
	case http.MethodDelete:
		return transport.proxyContainerGroupDeleteRequest(request)
	default:
		return http.DefaultTransport.RoundTrip(request)
	}
}

func (transport *Transport) proxyContainerGroupPutRequest(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, httperror.Forbidden("Permission denied to access environment", err)
	}

	// Serialize the existence check and creation for this environment.
	transport.createMu.Lock()
	defer transport.createMu.Unlock()

	validationRequest, err := http.NewRequestWithContext(request.Context(), http.MethodGet, request.URL.String(), nil)
	if err != nil {
		return nil, err
	}
	validationRequest.Header.Set("Authorization", request.Header.Get("Authorization"))

	validationResponse, err := http.DefaultTransport.RoundTrip(validationRequest)
	if err != nil {
		return validationResponse, err
	}

	if validationResponse.StatusCode >= 200 && validationResponse.StatusCode < 300 {
		_ = validationResponse.Body.Close()
		resp := &http.Response{
			Header: http.Header{
				http.CanonicalHeaderKey("content-type"): []string{"application/json"},
			},
		}
		errObj := map[string]string{
			"message": "A container instance with the same name already exists inside the selected resource group",
		}
		err = utils.RewriteResponse(resp, errObj, http.StatusConflict)

		return resp, err
	}
	if validationResponse.StatusCode != http.StatusNotFound {
		return validationResponse, nil
	}
	_, _ = io.Copy(io.Discard, io.LimitReader(validationResponse.Body, 4096))
	_ = validationResponse.Body.Close()

	response, err := http.DefaultTransport.RoundTrip(request)
	if err != nil || response.StatusCode < 200 || response.StatusCode >= 300 {
		return response, err
	}

	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return response, err
	}

	containerGroupID, ok := responseObject["id"].(string)
	if !ok {
		return response, errors.New("Missing container group ID")
	}

	resourceControl, err := transport.createPrivateResourceControl(containerGroupID, portainer.ContainerGroupResourceControl, tokenData.ID)
	if err != nil {
		return response, err
	}

	responseObject = decorateObject(responseObject, resourceControl)

	err = utils.RewriteResponse(response, responseObject, response.StatusCode)

	return response, err
}

func (transport *Transport) proxyContainerGroupGetRequest(request *http.Request) (*http.Response, error) {
	response, err := http.DefaultTransport.RoundTrip(request)
	if err != nil || response.StatusCode != http.StatusOK {
		return response, err
	}

	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return nil, err
	}

	context, err := transport.createAzureRequestContext(request)
	if err != nil {
		return nil, err
	}

	responseObject = transport.decorateContainerGroup(responseObject, context)

	if err := utils.RewriteResponse(response, responseObject, http.StatusOK); err != nil {
		log.Warn().Err(err).Msg("failed to rewrite response")
	}

	return response, nil
}

func (transport *Transport) proxyContainerGroupDeleteRequest(request *http.Request) (*http.Response, error) {
	context, err := transport.createAzureRequestContext(request)
	if err != nil {
		return nil, err
	}

	if !transport.userCanDeleteContainerGroup(request, context) {
		return utils.WriteAccessDeniedResponse()
	}

	response, err := http.DefaultTransport.RoundTrip(request)
	if err == nil && (response.StatusCode == http.StatusOK || response.StatusCode == http.StatusNoContent) {
		if err := transport.removeResourceControl(request.URL.Path, context); err != nil {
			log.Warn().Err(err).Msg("failed to remove resource control")
		}
	}

	return response, err
}
