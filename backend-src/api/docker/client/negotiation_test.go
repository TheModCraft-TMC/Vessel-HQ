package client

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

// Pin the protocol floor, not the latest daemon's API. In particular Podman's
// Docker-compatible service advertises API 1.41, even on recent Podman releases.
func TestFactoryNegotiatesOlderEngineProtocols(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.40", "1.41", "1.54"} {
		t.Run(version, func(t *testing.T) {
			t.Parallel()
			var mu sync.Mutex
			var paths []string
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				mu.Lock()
				paths = append(paths, r.URL.Path)
				mu.Unlock()
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", version)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				if r.URL.Path == "/v"+version+"/containers/json" {
					_ = json.NewEncoder(w).Encode([]map[string]any{{"Id": "podman-compatible", "State": "running"}})
					return
				}
				http.Error(w, "unexpected API version", http.StatusBadRequest)
			}))
			defer srv.Close()
			cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{
				Type: portainer.DockerEnvironment,
				URL:  "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", nil)
			require.NoError(t, err)
			defer cli.Close()
			result, err := cli.ContainerList(t.Context(), client.ContainerListOptions{All: true})
			require.NoError(t, err)
			require.Len(t, result.Items, 1)
			require.Equal(t, "podman-compatible", result.Items[0].ID)
			require.Equal(t, version, cli.ClientVersion())
			mu.Lock()
			defer mu.Unlock()
			require.Equal(t, []string{"/_ping", "/v" + version + "/containers/json"}, paths)
		})
	}
}
