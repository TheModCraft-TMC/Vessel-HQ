package compose

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/config"
	"github.com/docker/compose/v5/pkg/api"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

// Give tests that substitute the Compose service a real isolated negotiation
// endpoint too; they must not depend on a developer's default Docker socket.
func useCLIProtocolEngine(t *testing.T, version string) string {
	t.Helper()
	old := config.Dir()
	config.SetDir(t.TempDir())
	t.Cleanup(func() { config.SetDir(old) })
	for _, key := range []string{"DOCKER_CONTEXT", "DOCKER_API_VERSION", "DOCKER_CUSTOM_HEADERS", "DOCKER_TLS_VERIFY", "DOCKER_TLS"} {
		t.Setenv(key, "")
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/_ping", r.URL.Path, "mock Compose tests must only negotiate")
		w.Header().Set("API-Version", version)
	}))
	t.Cleanup(server.Close)
	host := "tcp" + strings.TrimPrefix(server.URL, "http")
	t.Setenv("DOCKER_HOST", host)
	return host
}

func TestRealComposeConsumesCompatibleCLI(t *testing.T) {
	for _, version := range []string{"1.24", "1.39", "1.41", "1.54", ""} {
		t.Run(version, func(t *testing.T) {
			useCLIProtocolEngine(t, version)
			expected := version
			if expected == "" {
				expected = "1.24"
			}
			var lists atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", version)
					return
				}
				require.Equal(t, "/v"+expected+"/containers/json", r.URL.Path)
				require.Contains(t, r.URL.Query().Get("filters"), "com.docker.compose.project")
				lists.Add(1)
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprint(w, `[]`)
			}))
			defer server.Close()
			ctx, cancel := context.WithCancel(t.Context())
			cancel()
			// Exercise the actual Compose service (not api.Compose method stubs)
			// through the product's withComposeService callsite and detached ctx.
			d := NewComposeDeployer()
			require.NoError(t, d.withComposeService(ctx, nil, libstack.Options{Host: "tcp" + strings.TrimPrefix(server.URL, "http")},
				func(ctx context.Context, service api.Compose, _ *types.Project) error {
					require.NoError(t, ctx.Err())
					_, err := service.Ps(ctx, "legacy-project", api.PsOptions{All: true})
					return err
				}))
			require.Positive(t, lists.Load())
		})
	}
}
