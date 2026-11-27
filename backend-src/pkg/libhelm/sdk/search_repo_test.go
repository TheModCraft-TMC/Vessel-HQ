package sdk

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/stretchr/testify/require"
)

func Test_SearchRepo(t *testing.T) {
	// SearchRepo creates CLI settings for each request. Keep its cache and
	// repositories file private, and avoid concurrent writers to that file.
	t.Setenv("HELM_CONFIG_HOME", t.TempDir())
	t.Setenv("HELM_CACHE_HOME", t.TempDir())
	t.Setenv("HELM_DATA_HOME", t.TempDir())

	const index = `apiVersion: v1
generated: "2026-11-20T00:00:00Z"
entries:
  example:
    - name: example
      version: 1.2.3
      apiVersion: v2
      description: Local repository fixture
      urls:
        - example-1.2.3.tgz
`
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/charts/index.yaml":
			w.Header().Set("Content-Type", "text/yaml")
			_, _ = w.Write([]byte(index))
		case "/invalid/index.yaml":
			_, _ = w.Write([]byte("entries: [invalid yaml"))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)

	hspm := NewHelmSDKPackageManager()
	for _, tc := range []struct {
		name string
		path string
	}{
		{"repository", "/charts"},
		{"repository with trailing slash", "/charts/"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			response, err := hspm.SearchRepo(options.SearchRepoOptions{Repo: server.URL + tc.path})
			require.NoError(t, err)
			var result RepoIndex
			require.NoError(t, json.Unmarshal(response, &result))
			require.Equal(t, "v1", result.APIVersion)
			require.Equal(t, "2026-11-20 00:00:00 +0000 UTC", result.Generated)
			require.Len(t, result.Entries["example"], 1)
			require.Equal(t, "1.2.3", result.Entries["example"][0].Version)
		})
	}

	for _, tc := range []struct {
		name string
		repo string
	}{
		{"not a repository", server.URL + "/missing"},
		{"malformed index", server.URL + "/invalid"},
		{"empty repository URL", ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := hspm.SearchRepo(options.SearchRepoOptions{Repo: tc.repo})
			require.Error(t, err)
		})
	}
}
