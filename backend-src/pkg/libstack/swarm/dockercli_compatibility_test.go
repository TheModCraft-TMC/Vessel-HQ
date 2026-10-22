package swarm

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSwarmCallsitesConsumeCompatibleCLI(t *testing.T) {
	for _, version := range []string{"1.24", "1.39", "1.41", "1.54", ""} {
		t.Run(version, func(t *testing.T) {
			expected := version
			if expected == "" {
				expected = "1.24"
			}
			var operations atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", version)
					return
				}
				operations.Add(1)
				require.True(t, strings.HasPrefix(r.URL.Path, "/v"+expected+"/"), "unexpected versioned request %s", r.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				if strings.HasSuffix(r.URL.Path, "/info") {
					fmt.Fprint(w, `{"Swarm":{"ControlAvailable":false}}`)
					return
				}
				require.Contains(t, r.URL.Query().Get("filters"), "com.docker.stack.namespace")
				fmt.Fprint(w, `[]`)
			}))
			defer server.Close()
			d := NewSwarmDeployer()
			opts := Options{Host: "tcp" + strings.TrimPrefix(server.URL, "http"), ProjectName: "legacy-swarm"}
			// At 1.24 secrets/configs do not exist. Exercise the real deploy
			// Info/manager check without pretending those newer APIs exist.
			err := d.Deploy(t.Context(), nil, DeployOptions{Options: opts})
			require.ErrorContains(t, err, "this node is not a swarm manager")
			if expected != "1.24" {
				require.NoError(t, d.Remove(t.Context(), opts.ProjectName, RemoveOptions{Options: opts}))
				require.EqualValues(t, 5, operations.Load(), "Info plus services, secrets, configs and networks")
			} else {
				require.EqualValues(t, 1, operations.Load())
			}
		})
	}
}
