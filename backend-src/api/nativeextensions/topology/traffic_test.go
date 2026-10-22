package topology

import (
	"context"
	"encoding/json"
	"github.com/moby/moby/api/types/container"
	mobyclient "github.com/moby/moby/client"
	"io"
	"strings"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestRoutingLabelsRedactSensitiveValuesAndKeepSelectedConfiguration(t *testing.T) {
	snapshot := &TrafficSnapshot{}
	routingLabels(snapshot, "web", map[string]string{
		"traefik.http.routers.app.rule":                                            "Host(`demo.local`) && PathPrefix(`/app`)",
		"traefik.http.routers.app.entrypoints":                                     "websecure",
		"traefik.http.routers.app.tls":                                             "true",
		"traefik.http.routers.app.middlewares":                                     "auth,strip@docker",
		"traefik.http.services.app.loadbalancer.server.port":                       "8080",
		"traefik.http.middlewares.auth.basicauth.users":                            "SECRET_PASSWORD_HASH",
		"traefik.http.middlewares.auth.headers.customrequestheaders.authorization": "SECRET_TOKEN",
		"traefik.http.middlewares.strip.stripprefix.prefixes":                      "/app",
		"traefik.http.routers.private.rule":                                        "Header(`Authorization`, `SECRET_RULE`)",
		"unrelated.secret":                                                         "SECRET_UNRELATED",
	})
	require.Len(t, snapshot.Routers, 2)
	for _, router := range snapshot.Routers {
		if router.ID == "app" {
			require.Equal(t, "app", router.Service)
			require.True(t, router.TLS)
			require.Equal(t, []string{"websecure"}, router.EntryPoints)
		}
	}
	require.Len(t, snapshot.Services, 1)
	require.Equal(t, 8080, snapshot.Services[0].Port)
	encoded, err := json.Marshal(snapshot)
	require.NoError(t, err)
	for _, secret := range []string{"SECRET_PASSWORD_HASH", "SECRET_TOKEN", "SECRET_RULE", "SECRET_UNRELATED"} {
		require.NotContains(t, string(encoded), secret)
	}
	require.Contains(t, string(encoded), "redacted sensitive rule")
	require.Contains(t, string(encoded), "/app")
	for _, middleware := range snapshot.Middlewares {
		if middleware.ID == "auth" {
			require.True(t, middleware.Redacted)
			require.Empty(t, middleware.Settings)
		}
	}
	disabled := &TrafficSnapshot{}
	routingLabels(disabled, "hidden", map[string]string{"traefik.enable": "false", "traefik.http.routers.hidden.rule": "Host(`hidden`)"})
	require.Empty(t, disabled.Routers)
}

type trafficDocker struct {
	*fakeDocker
	mu       sync.Mutex
	statsIDs []string
	stats    string
}

func (f *trafficDocker) ContainerList(ctx context.Context, options mobyclient.ContainerListOptions) ([]container.Summary, error) {
	items, err := f.fakeDocker.ContainerList(ctx, options)
	items[0].State = "running"
	items[0].Labels["traefik.http.routers.app.rule"] = "Host(`demo.local`)"
	items[0].Labels["traefik.http.services.app.loadbalancer.server.port"] = "8080"
	items[1].Labels["traefik.http.routers.other.rule"] = "Host(`PRIVATE_OTHER`)"
	return items, err
}
func (f *trafficDocker) ContainerStatsOneShot(_ context.Context, id string) (mobyclient.ContainerStatsResult, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.statsIDs = append(f.statsIDs, id)
	return mobyclient.ContainerStatsResult{Body: io.NopCloser(strings.NewReader(f.stats))}, nil
}
func TestTrafficReadsOnlySelectedWorkloadLabelsAndCounters(t *testing.T) {
	client := &trafficDocker{fakeDocker: &fakeDocker{t: t}, stats: `{"id":"target-container","networks":{"eth0":{"rx_bytes":1024,"tx_bytes":512},"eth1":{"rx_bytes":20,"tx_bytes":30}},"secret":"NOT_RETURNED"}`}
	graph, err := readDockerTraffic(t.Context(), &portainer.Stack{ID: 2, EndpointID: 1, Name: "target", Type: portainer.DockerComposeStack}, client)
	require.NoError(t, err)
	require.Equal(t, []string{"target-container"}, client.statsIDs)
	require.Len(t, graph.Traffic.Routers, 1)
	require.Len(t, graph.Traffic.Counters, 1)
	counter := graph.Traffic.Counters[0]
	require.True(t, counter.Available)
	require.EqualValues(t, 1044, counter.ReceivedBytes)
	require.EqualValues(t, 542, counter.SentBytes)
	encoded, err := json.Marshal(graph)
	require.NoError(t, err)
	for _, secret := range []string{"PRIVATE_OTHER", "NOT_RETURNED", "secret-label", "secret-address", "secret-command"} {
		require.NotContains(t, string(encoded), secret)
	}
	require.Contains(t, string(encoded), `"receivedBytes":"1044"`)
}
func TestStatsRejectMismatchedIdentityOversizedAndOverflow(t *testing.T) {
	for _, stats := range []string{`{"id":"other","networks":{"eth0":{"rx_bytes":1}}}`, `{"id":"target","networks":{"eth0":{"rx_bytes":18446744073709551615},"eth1":{"rx_bytes":1}}}`, strings.Repeat("x", 1024*1024+1), `{"id":"target","networks":{}}`} {
		client := &trafficDocker{stats: stats}
		counter := readCounter(t.Context(), client, "target")
		require.False(t, counter.Available)
	}
}
