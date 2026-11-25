package websocket

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/moby/moby/api/types/events"
	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestEngineEventsInvalidateAndCancelStream(t *testing.T) {
	disconnected := make(chan struct{})
	noiseSent := make(chan struct{})
	startContainer := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.True(t, strings.HasSuffix(r.URL.Path, "/events"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("{\"Type\":\"container\",\"Action\":\"exec_start: healthcheck\"}\n{\"Type\":\"container\",\"Action\":\"top\"}\n"))
		w.(http.Flusher).Flush()
		close(noiseSent)
		select {
		case <-startContainer:
		case <-r.Context().Done():
			close(disconnected)
			return
		}
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
		h.consumeEngineEvents(ctx, cli, &portainer.Endpoint{ID: 7}, nil)
	}()
	select {
	case <-noiseSent:
	case <-time.After(5 * time.Second):
		t.Fatal("engine stream did not connect")
	}
	select {
	case event := <-updates:
		t.Fatalf("read-only engine activity invalidated the snapshot: %+v", event)
	case <-time.After(750 * time.Millisecond):
	}
	close(startContainer)
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

func TestEngineWatchHealthKeepsFallbackUntilEventsAreObserved(t *testing.T) {
	h := &Handler{engineWatches: map[int]*engineWatch{7: {}}}
	require.False(t, h.engineWatchHealthy(7))
	h.engineWatches[7].healthy.Store(true)
	require.True(t, h.engineWatchHealthy(7))
	require.False(t, h.engineWatchHealthy(8))
	h.engineWatches[7].healthy.Store(false)
	require.False(t, h.engineWatchHealthy(7), "a failed/reconnecting watch must restore snapshot fallback")
}

func TestEngineEventChangesSnapshot(t *testing.T) {
	for _, action := range []events.Action{
		"exec_create: /bin/sh -c healthcheck", "exec_start: healthcheck", "exec_die", "exec_detach",
		"attach", "detach", "resize", "top", "copy", "archive-path", "export",
	} {
		t.Run(string(action), func(t *testing.T) {
			require.False(t, engineEventChangesSnapshot(events.Message{Type: events.ContainerEventType, Action: action}))
		})
	}
	for _, action := range []events.Action{
		"create", "start", "stop", "restart", "die", "destroy", "pause", "unpause", "update", "rename",
		"health_status: healthy", "health_status: unhealthy", "extract-to-dir", "future-action",
	} {
		t.Run(string(action), func(t *testing.T) {
			require.True(t, engineEventChangesSnapshot(events.Message{Type: events.ContainerEventType, Action: action}))
		})
	}
	for _, kind := range []events.Type{events.NetworkEventType, events.VolumeEventType, events.ServiceEventType, events.ImageEventType} {
		t.Run(string(kind), func(t *testing.T) {
			require.True(t, engineEventChangesSnapshot(events.Message{Type: kind, Action: events.ActionCreate}))
		})
	}
}
