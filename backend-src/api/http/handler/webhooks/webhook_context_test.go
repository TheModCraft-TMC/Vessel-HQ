package webhooks

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/require"
)

func TestServiceWebhookCancellationIncludesClientNegotiation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { <-r.Context().Done() }))
	defer server.Close()
	defer server.CloseClientConnections()
	ctx, cancel := context.WithTimeout(t.Context(), 100*time.Millisecond)
	defer cancel()
	handler := &Handler{DockerClientFactory: &dockerclient.ClientFactory{}}
	endpoint := &portainer.Endpoint{Type: portainer.DockerEnvironment, URL: strings.Replace(server.URL, "http://", "tcp://", 1)}
	done := make(chan *httperror.HandlerError, 1)
	go func() { done <- handler.executeServiceWebhook(ctx, httptest.NewRecorder(), endpoint, "fixture", 0, "") }()
	select {
	case result := <-done:
		require.NotNil(t, result)
	case <-time.After(3 * time.Second):
		t.Fatal("webhook negotiation ignored its request deadline")
	}
}
