package snapshot

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"

	"github.com/stretchr/testify/require"
)

// Real HTTP is intentional: the split SDK successfully decodes /version but
// discards these legacy top-level fields before returning ServerVersionResult.
func TestDockerSnapshotVersionComponentlessLegacy(t *testing.T) {
	t.Parallel()
	for _, apiVersion := range []string{"1.24", "1.39"} {
		t.Run(apiVersion, func(t *testing.T) {
			t.Parallel()
			var calls atomic.Int32
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", apiVersion)
					return
				}
				if r.Method != http.MethodGet || r.URL.Path != "/v"+apiVersion+"/version" {
					http.Error(w, "unexpected request", http.StatusBadRequest)
					return
				}
				calls.Add(1)
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprintf(w, `{"Version":"1.12.6","ApiVersion":%q,"GitCommit":"78d1802","GoVersion":"go1.6.4","Os":"linux","Arch":"amd64","KernelVersion":"4.4.0","BuildTime":"2017-01-10T20:40:42.445Z"}`, apiVersion)
			}))
			defer srv.Close()
			cli, err := dockerclient.NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{
				URL: "tcp://" + strings.TrimPrefix(srv.URL, "http://"),
			}, "", nil)
			require.NoError(t, err)
			defer cli.Close()

			snap := &portainer.DockerSnapshot{}
			require.NoError(t, dockerSnapshotVersion(snap, cli))
			v := snap.SnapshotRaw.Version
			require.Equal(t, "78d1802", v.GitCommit)
			require.Equal(t, "go1.6.4", v.GoVersion)
			require.Equal(t, "4.4.0", v.KernelVersion)
			require.Equal(t, "2017-01-10T20:40:42.445Z", v.BuildTime)
			require.Equal(t, apiVersion, v.APIVersion)
			require.Equal(t, "1.12.6", v.Version)
			require.Equal(t, "linux", v.Os)
			require.Equal(t, "amd64", v.Arch)
			require.Empty(t, v.Components)
			require.False(t, snap.IsPodman)
			require.EqualValues(t, 1, calls.Load(), "capture must not issue another request")
		})
	}
}
