package snapshot

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"

	"github.com/stretchr/testify/require"
)

func TestDockerSnapshotVersionRetainsTopLevelDiagnosticsAlongsideComponents(t *testing.T) {
	t.Parallel()
	for _, details := range []string{`{}`, `{"GitCommit":"component-commit","GoVersion":"component-go"}`} {
		t.Run(details, func(t *testing.T) {
			t.Parallel()
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", "1.39")
					return
				}
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprintf(w, `{"Version":"18.09.0","ApiVersion":"1.39","GitCommit":"top-commit","GoVersion":"top-go","KernelVersion":"top-kernel","BuildTime":"top-build","Components":[{"Name":"Engine","Details":%s}]}`, details)
			}))
			defer server.Close()
			cli, err := dockerclient.NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: server.URL}, "", nil)
			require.NoError(t, err)
			defer cli.Close()

			result := &portainer.DockerSnapshot{}
			require.NoError(t, dockerSnapshotVersion(result, cli))
			version := result.SnapshotRaw.Version
			require.Equal(t, "top-commit", version.GitCommit)
			require.Equal(t, "top-go", version.GoVersion)
			require.Equal(t, "top-kernel", version.KernelVersion)
			require.Equal(t, "top-build", version.BuildTime)
		})
	}
}
