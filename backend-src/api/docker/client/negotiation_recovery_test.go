package client

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

// Exercise real HTTP and the actual SDK, including its HEAD -> GET ping
// fallback. A fast synthetic transport does not expose the former 5s cutoff.
func TestFactoryNegotiatesSlowFirstPing(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.24", "1.39", "1.54"} {
		t.Run(version, func(t *testing.T) {
			t.Parallel()
			var pings atomic.Int32
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					if pings.Add(1) == 1 {
						time.Sleep(5200 * time.Millisecond)
					}
					w.Header().Set("API-Version", version)
					return
				}
				if r.URL.Path != "/v"+version+"/info" {
					http.NotFound(w, r)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"ID":"slow-engine"}`))
			}))
			defer srv.Close()
			timeout := 20 * time.Second
			cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{
				URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", &timeout)
			require.NoError(t, err)
			defer cli.Close()
			result, err := cli.Info(t.Context(), client.InfoOptions{})
			require.NoError(t, err)
			require.Equal(t, "slow-engine", result.Info.ID)
			require.Equal(t, version, cli.ClientVersion())
			require.EqualValues(t, 1, pings.Load(), "the requested timeout must allow the first ping to finish")
		})
	}
}

func TestFactoryNegotiatesAfterTransientFirstProbe(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.24", "1.39", "1.41", "1.54"} {
		t.Run(version, func(t *testing.T) {
			t.Parallel()
			var pings atomic.Int32
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					// Fail both methods in the SDK's first Ping call, not just
					// HEAD (which the SDK already retries as GET).
					if pings.Add(1) <= 2 {
						http.Error(w, "engine restarting", http.StatusServiceUnavailable)
						return
					}
					w.Header().Set("API-Version", version)
					return
				}
				if r.URL.Path != "/v"+version+"/info" {
					http.NotFound(w, r)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"ID":"recovered-engine"}`))
			}))
			defer srv.Close()
			timeout := 20 * time.Second
			cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{
				URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", &timeout)
			require.NoError(t, err)
			defer cli.Close()
			result, err := cli.Info(t.Context(), client.InfoOptions{})
			require.NoError(t, err)
			require.Equal(t, "recovered-engine", result.Info.ID)
			require.Equal(t, version, cli.ClientVersion())
		})
	}
}
