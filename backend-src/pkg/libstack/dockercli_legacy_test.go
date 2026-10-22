package libstack

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/docker/cli/cli/command"
	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

// The product ClientFactory compatibility tests do not cover the CLI
// client used by Compose and Swarm. Keep those real HTTP requests at the daemon's
// advertised version, including the previous SDK's missing-header fallback.
func TestWithCliNegotiatesLegacyEngines(t *testing.T) {
	for _, version := range []string{"1.24", "1.39", "1.54", ""} {
		t.Run("api="+version, func(t *testing.T) {
			expected := version
			if expected == "" {
				expected = "1.24"
			}
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					if version != "" {
						w.Header().Set("API-Version", version)
					}
					w.Header().Set("OSType", "linux")
					_, _ = fmt.Fprint(w, "OK")
					return
				}
				w.Header().Set("Content-Type", "application/json")
				if r.URL.Path != "/v"+expected+"/info" {
					w.WriteHeader(http.StatusBadRequest)
					_, _ = fmt.Fprintf(w, `{"message":"unexpected API request %s; daemon supports %s"}`, r.URL.Path, expected)
					return
				}
				_, _ = fmt.Fprint(w, `{"ServerVersion":"review-fixture"}`)
			}))
			defer server.Close()

			err := WithCli(t.Context(), DockerCliOptions{Host: "tcp://" + strings.TrimPrefix(server.URL, "http://")},
				func(ctx context.Context, cli *command.DockerCli) error {
					result, err := cli.Client().Info(ctx, client.InfoOptions{})
					if err == nil {
						require.Equal(t, "review-fixture", result.Info.ServerVersion)
						require.Equal(t, expected, cli.Client().ClientVersion())
					}
					return err
				})
			require.NoError(t, err)
		})
	}
}
