package client

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

func TestFactoryNegotiatedClientConcurrentOperations(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.24", "1.39", "1.41", "1.54"} {
		t.Run(version, func(t *testing.T) {
			t.Parallel()
			var pings atomic.Int32
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					pings.Add(1)
					w.Header().Set("API-Version", version)
					return
				}
				if r.URL.Path != "/v"+version+"/info" {
					http.NotFound(w, r)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"ID":"concurrent-engine"}`))
			}))
			defer srv.Close()
			cli, err := NewClientFactory(nil, nil).CreateClientWithContext(t.Context(), &portainer.Endpoint{
				URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", nil)
			require.NoError(t, err)
			defer cli.Close()
			var wg sync.WaitGroup
			errors := make(chan error, 16)
			for range 16 {
				wg.Go(func() {
					_, err := cli.Info(t.Context(), client.InfoOptions{})
					errors <- err
				})
			}
			wg.Wait()
			close(errors)
			for err := range errors {
				require.NoError(t, err)
			}
			require.Equal(t, version, cli.ClientVersion())
			require.EqualValues(t, 1, pings.Load())
		})
	}
}

func TestFactoryValidatesAndCapsAdvertisedAPIVersion(t *testing.T) {
	t.Parallel()
	for _, version := range []string{"1.99", "not-an-api-version"} {
		t.Run(version, func(t *testing.T) {
			t.Parallel()
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("API-Version", version)
			}))
			defer srv.Close()
			cli, err := NewClientFactory(nil, nil).CreateClientWithContext(t.Context(), &portainer.Endpoint{
				URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", nil)
			if version == "not-an-api-version" {
				require.Error(t, err)
				require.Nil(t, cli)
				return
			}
			require.NoError(t, err)
			defer cli.Close()
			require.Equal(t, client.MaxAPIVersion, cli.ClientVersion())
		})
	}
}
