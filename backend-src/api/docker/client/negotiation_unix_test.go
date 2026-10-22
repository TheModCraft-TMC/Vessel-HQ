//go:build !windows

package client

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

func TestFactoryNegotiatesLegacyUnixSocket(t *testing.T) {
	t.Parallel()
	// Darwin's Unix socket path limit is short; do not append the full test name.
	dir, err := os.MkdirTemp("/tmp", "vessel-dep-sock-")
	require.NoError(t, err)
	defer os.RemoveAll(dir)
	socket := filepath.Join(dir, "docker.sock")
	listener, err := net.Listen("unix", socket)
	require.NoError(t, err)
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.24")
			return
		}
		if r.URL.Path == "/v1.24/version" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(legacyVersionBody))
			return
		}
		if r.URL.Path != "/v1.24/containers/json" {
			http.Error(w, "unexpected API", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[]`))
	}))
	_ = server.Listener.Close()
	server.Listener = listener
	server.Start()
	defer server.Close()
	cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: "unix://" + socket}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	_, err = cli.ContainerList(t.Context(), client.ContainerListOptions{})
	require.NoError(t, err)
	require.Equal(t, "1.24", cli.ClientVersion())
	version, err := ServerVersion(t.Context(), cli)
	require.NoError(t, err)
	requireLegacyVersion(t, version)
}

func TestFactoryLocalProbeTimeoutAndCancellation(t *testing.T) {
	t.Parallel()
	for _, callerDeadline := range []bool{false, true} {
		name := "legacy-entry-positive-timeout"
		if callerDeadline {
			name = "caller-deadline-with-unlimited-http-timeout"
		}
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			dir, err := os.MkdirTemp("/tmp", "vessel-dep-deadline-")
			require.NoError(t, err)
			defer os.RemoveAll(dir)
			socket := filepath.Join(dir, "docker.sock")
			listener, err := net.Listen("unix", socket)
			require.NoError(t, err)
			server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				<-r.Context().Done()
			}))
			_ = server.Listener.Close()
			server.Listener = listener
			server.Start()
			defer server.Close()
			timeout := 30 * time.Millisecond
			endpoint := &portainer.Endpoint{URL: "unix://" + socket}
			factory := NewClientFactory(nil, nil)
			start := time.Now()
			if callerDeadline {
				ctx, cancel := context.WithTimeout(t.Context(), timeout)
				defer cancel()
				timeout = 0
				cli, err := factory.CreateClientWithContext(ctx, endpoint, "", &timeout)
				require.ErrorIs(t, err, context.DeadlineExceeded)
				require.Nil(t, cli)
			} else {
				// Even the compatibility entry point without a caller context
				// must apply the supplied local negotiation budget.
				cli, err := factory.CreateClient(endpoint, "", &timeout)
				require.ErrorIs(t, err, context.DeadlineExceeded)
				require.Nil(t, cli)
			}
			require.Less(t, time.Since(start), time.Second)
		})
	}
}
