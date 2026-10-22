package topology

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	mobyclient "github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestDockerAdapterReadsTopologyAndOneShotTraffic(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v1.55/containers/json":
			require.Contains(t, r.URL.Query().Get("filters"), "com.docker.compose.project=target")
			_, _ = w.Write([]byte(`[{"Id":"target-container","Names":["/web"],"State":"running","Labels":{"com.docker.compose.project":"target"},"NetworkSettings":{"Networks":{"app":{"NetworkID":"attached"}}}}]`))
		case "/v1.55/networks/attached":
			_, _ = w.Write([]byte(`{"Id":"attached","Name":"app","Driver":"bridge","Scope":"local"}`))
		case "/v1.55/containers/target-container/stats":
			require.Equal(t, "false", r.URL.Query().Get("stream"))
			require.Equal(t, "true", r.URL.Query().Get("one-shot"))
			_, _ = w.Write([]byte(`{"id":"target-container","networks":{"eth0":{"rx_bytes":123,"tx_bytes":45}}}`))
		default:
			t.Errorf("unexpected Docker request: %s", r.URL)
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	client, err := mobyclient.New(mobyclient.WithHost(server.URL), mobyclient.WithAPIVersion("1.55"))
	require.NoError(t, err)
	defer client.Close()
	graph, err := readDockerTraffic(context.Background(), &portainer.Stack{ID: 2, EndpointID: 1, Name: "target", Type: portainer.DockerComposeStack}, dockerAdapter{client})
	require.NoError(t, err)
	require.Len(t, graph.Networks, 1)
	require.Equal(t, "attached", graph.Networks[0].ID)
	require.Len(t, graph.Traffic.Counters, 1)
	require.True(t, graph.Traffic.Counters[0].Available)
	require.EqualValues(t, 123, graph.Traffic.Counters[0].ReceivedBytes)
	require.EqualValues(t, 45, graph.Traffic.Counters[0].SentBytes)
}
