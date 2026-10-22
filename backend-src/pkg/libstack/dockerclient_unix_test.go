//go:build !windows

package libstack

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/docker/cli/cli/command"
	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

func TestWithCliUnixAndDefaultContext(t *testing.T) {
	isolateCLIConfig(t)
	// macOS Unix socket paths are short; do not use t.TempDir's long test name.
	dir, err := os.MkdirTemp("", "vcli-")
	require.NoError(t, err)
	defer os.RemoveAll(dir)
	path := filepath.Join(dir, "docker.sock")
	listener, err := net.Listen("unix", path)
	require.NoError(t, err)
	server := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "unix-agent", r.Header.Get("X-PortainerAgent-Signature"))
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.24")
			return
		}
		require.Equal(t, "/v1.24/info", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{}`)
	})}
	done := make(chan struct{})
	go func() { defer close(done); _ = server.Serve(listener) }()
	defer func() { _ = server.Close(); <-done }()
	for _, emptyHost := range []bool{false, true} {
		t.Run(fmt.Sprint(emptyHost), func(t *testing.T) {
			host := "unix://" + path
			opts := DockerCliOptions{Host: host, Headers: map[string]string{"X-PortainerAgent-Signature": "unix-agent"}}
			if emptyHost {
				opts.Host = ""
				t.Setenv("DOCKER_HOST", host)
			}
			require.NoError(t, WithCli(t.Context(), opts, func(ctx context.Context, cli *command.DockerCli) error {
				require.Equal(t, "default", cli.CurrentContext())
				require.Equal(t, host, cli.Client().DaemonHost())
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
}
