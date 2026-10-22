package endpoints

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	"github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/stretchr/testify/require"
)

func TestServiceUpdateResponsePreservesJSON(t *testing.T) {
	for _, test := range []struct {
		name     string
		warnings []string
		want     string
	}{
		{name: "nil warnings", want: `{"Warnings":null}`},
		{name: "empty warnings", warnings: []string{}, want: `{"Warnings":[]}`},
		{name: "warnings", warnings: []string{"registry unavailable"}, want: `{"Warnings":["registry unavailable"]}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			err := response.JSON(recorder, forceUpdateServiceResponse{Warnings: test.warnings})
			require.Nil(t, err)
			require.JSONEq(t, test.want, recorder.Body.String())

			// The pre-split SDK returned the API DTO directly. The split
			// client's result must serialize identically, including nil vs [].
			apiRecorder := httptest.NewRecorder()
			err = response.JSON(apiRecorder, swarm.ServiceUpdateResponse{Warnings: test.warnings})
			require.Nil(t, err)
			require.Equal(t, apiRecorder.Body.String(), recorder.Body.String())

			sdkRecorder := httptest.NewRecorder()
			err = response.JSON(sdkRecorder, client.ServiceUpdateResult{Warnings: test.warnings})
			require.Nil(t, err)
			require.Equal(t, sdkRecorder.Body.String(), recorder.Body.String())
		})
	}
}

func TestForceUpdateServicePayloadValidation(t *testing.T) {
	for _, id := range []string{"", " ", "\t\r\n"} {
		payload := forceUpdateServicePayload{ServiceID: id}
		require.Error(t, payload.Validate(nil), "blank ServiceID %q must be rejected", id)
	}
	for _, id := range []string{"my-service", "stack_service.1", "abc123", " service ", "name/unchanged"} {
		payload := forceUpdateServicePayload{ServiceID: id}
		require.NoError(t, payload.Validate(nil), "nonblank identifier must not be over-validated")
		require.Equal(t, id, payload.ServiceID, "validation must not rewrite identifiers")
	}
}

func TestForceUpdateServiceRejectsBlankIDBeforeAccessingEndpoint(t *testing.T) {
	for _, body := range []string{`{}`, `{"ServiceID":""}`, `{"ServiceID":" \t\r\n"}`} {
		t.Run(body, func(t *testing.T) {
			// No datastore, authorization service or Docker client is configured:
			// invalid input must fail before any of them is used.
			handler := &Handler{}
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPut, "/endpoints/1/forceupdateservice", strings.NewReader(body))
			request = mux.SetURLVars(request, map[string]string{"id": "1"})
			require.NotPanics(t, func() {
				httperror.LoggerHandler(handler.endpointForceUpdateService).ServeHTTP(recorder, request)
			})
			require.Equal(t, http.StatusBadRequest, recorder.Code)
			require.Contains(t, recorder.Body.String(), "ServiceID")
		})
	}
}
