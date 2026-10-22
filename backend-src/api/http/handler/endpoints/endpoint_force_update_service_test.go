package endpoints

import (
	"net/http/httptest"
	"testing"

	"github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
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
