package client

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

// Preserve the former factory's negotiated range rather than inheriting the
// split SDK's automatic 1.40 floor. Podman advertises API 1.41 even on recent releases.
func TestFactoryNegotiatesOlderEngineProtocols(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.24", "1.39", "1.40", "1.41", "1.54"} {
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

func TestFactoryPreservesPreNegotiationFallback(t *testing.T) {
	t.Parallel()
	var mu sync.Mutex
	var paths []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		paths = append(paths, r.URL.Path)
		mu.Unlock()
		if r.URL.Path != "/_ping" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[]`))
		}
	}))
	defer srv.Close()
	cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://")}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	_, err = cli.ContainerList(t.Context(), client.ContainerListOptions{})
	require.NoError(t, err)
	require.Equal(t, "1.24", cli.ClientVersion())
	mu.Lock()
	defer mu.Unlock()
	require.Equal(t, []string{"/_ping", "/v1.24/containers/json"}, paths)
}

func TestFactoryPreservesLegacyAgentHeaders(t *testing.T) {
	t.Parallel()
	var mu sync.Mutex
	var headers []http.Header
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		headers = append(headers, r.Header.Clone())
		mu.Unlock()
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.39")
			return
		}
		if r.URL.Path != "/v1.39/containers/legacy/json" {
			http.Error(w, "unexpected legacy inspect path", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"Id":"legacy","Config":{},"State":{"Status":"running"},"NetworkSettings":{}}`))
	}))
	defer srv.Close()
	cli, err := NewClientFactory(testhelpers.NewStubSignatureService(), nil).CreateClient(&portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment,
		URL:  "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
	}, "node-a", nil)
	require.NoError(t, err)
	defer cli.Close()
	result, err := cli.ContainerInspect(t.Context(), "legacy", client.ContainerInspectOptions{})
	require.NoError(t, err)
	require.Equal(t, "legacy", result.Container.ID)
	mu.Lock()
	defer mu.Unlock()
	require.Len(t, headers, 2)
	for _, header := range headers {
		require.Equal(t, "node-a", header.Get(portainer.PortainerAgentTargetHeader))
		require.Equal(t, testhelpers.StubPublicKey, header.Get(portainer.PortainerAgentPublicKeyHeader))
		require.Equal(t, testhelpers.StubSignature, header.Get(portainer.PortainerAgentSignatureHeader))
	}
}

func TestFactoryProbeHonorsShortTimeout(t *testing.T) {
	t.Parallel()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	defer srv.Close()
	timeout := 30 * time.Millisecond
	start := time.Now()
	cli, err := NewClientFactory(nil, nil).CreateClientWithContext(t.Context(), &portainer.Endpoint{URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://")}, "", &timeout)
	require.ErrorIs(t, err, context.DeadlineExceeded)
	require.Nil(t, cli, "a failed negotiation must never expose a wrongly versioned client")
	require.Less(t, time.Since(start), time.Second)
}

func TestFactoryProbeHonorsCallerCancellation(t *testing.T) {
	t.Parallel()
	started := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-r.Context().Done()
	}))
	defer srv.Close()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	go func() {
		<-started
		cancel()
	}()
	// Zero disables HTTP timeouts, but must not disable caller cancellation.
	timeout := time.Duration(0)
	cli, err := NewClientFactory(nil, nil).CreateClientWithContext(ctx, &portainer.Endpoint{URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://")}, "", &timeout)
	require.ErrorIs(t, err, context.Canceled)
	require.Nil(t, cli)
}

func TestFactoryOperationHonorsCancellationAfterNegotiation(t *testing.T) {
	t.Parallel()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("API-Version", "1.39")
	}))
	defer srv.Close()
	cli, err := NewClientFactory(nil, nil).CreateClientWithContext(t.Context(), &portainer.Endpoint{URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://")}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	_, err = cli.ContainerList(ctx, client.ContainerListOptions{})
	require.ErrorIs(t, err, context.Canceled)
}

func TestFactoryNegotiatesLegacyTLSProtocol(t *testing.T) {
	t.Parallel()
	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.39")
			return
		}
		if r.URL.Path != "/v1.39/containers/json" {
			http.Error(w, "unexpected legacy TLS path", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[]`))
	}))
	defer srv.Close()
	cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{
		URL:       "tcp://" + strings.TrimPrefix(srv.URL, "https://"),
		TLSConfig: portainer.TLSConfiguration{TLS: true, TLSSkipVerify: true},
	}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	_, err = cli.ContainerList(t.Context(), client.ContainerListOptions{})
	require.NoError(t, err)
	require.Equal(t, "1.39", cli.ClientVersion())
}
