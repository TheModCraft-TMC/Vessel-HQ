package compose

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

func TestComposeConfigurationDoesNotRequireAnEngine(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		http.Error(w, "engine unavailable", http.StatusServiceUnavailable)
	}))
	defer server.Close()
	t.Setenv("DOCKER_HOST", "tcp"+strings.TrimPrefix(server.URL, "http"))
	dir := t.TempDir()
	file := createFile(t, dir, "compose.yaml", "services:\n  app:\n    image: ${PROJECT_IMAGE}\n")
	options := libstack.Options{ProjectName: "offline-config", WorkingDir: dir, Env: []string{"PROJECT_IMAGE=alpine:3.20", "COMPOSE_PARALLEL_LIMIT=2"}}
	deployer := NewComposeDeployer()
	for _, cancelled := range []bool{false, true} {
		ctx, cancel := context.WithCancel(t.Context())
		if cancelled {
			cancel()
		}
		require.NoError(t, deployer.Validate(ctx, []string{file}, options))
		config, err := deployer.Config(ctx, []string{file}, options)
		require.NoError(t, err)
		require.Contains(t, string(config), "image: alpine:3.20")
		require.Contains(t, string(config), "name: offline-config")
		cancel()
	}
	require.Zero(t, requests.Load(), "pure configuration must not probe an engine")

	options.Env = []string{"PROJECT_IMAGE=alpine:3.20", "COMPOSE_PARALLEL_LIMIT=invalid"}
	err := deployer.Validate(t.Context(), []string{file}, options)
	require.ErrorContains(t, err, "COMPOSE_PARALLEL_LIMIT must be an integer")
	_, err = deployer.Config(t.Context(), []string{file}, options)
	require.ErrorContains(t, err, "COMPOSE_PARALLEL_LIMIT must be an integer")
	require.Zero(t, requests.Load())
}
