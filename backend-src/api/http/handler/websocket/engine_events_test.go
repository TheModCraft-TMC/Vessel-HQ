package websocket

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestEngineEventsInvalidateAndCancelStream(t *testing.T) {
	disconnected := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.True(t, strings.HasSuffix(r.URL.Path, "/events"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("{\"Type\":\"container\",\"Action\":\"start\",\"Actor\":{\"ID\":\"private-container\"}}\n"))
		w.(http.Flusher).Flush()
		<-r.Context().Done()
		close(disconnected)
	}))
	defer server.Close()
	cli, err := client.New(client.WithHost(server.URL), client.WithAPIVersion("1.47"))
	require.NoError(t, err)
	defer cli.Close()
	h := &Handler{eventHub: newEventHub()}
	updates, unsubscribe, _ := h.eventHub.subscribeEndpoint(7)
	defer unsubscribe()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	stopped := make(chan struct{})
	go func() {
		defer close(stopped)
		h.consumeEngineEvents(ctx, cli, &portainer.Endpoint{ID: 7})
	}()
	select {
	case event := <-updates:
		require.Equal(t, eventMessage{Version: 1, ID: 1, Type: "invalidate"}, event)
	case <-time.After(5 * time.Second):
		t.Fatal("external engine change did not invalidate the viewed environment")
	}
	cancel()
	for _, done := range []<-chan struct{}{stopped, disconnected} {
		select {
		case <-done:
		case <-time.After(5 * time.Second):
			t.Fatal("engine stream retained after cancellation")
		}
	}
}
