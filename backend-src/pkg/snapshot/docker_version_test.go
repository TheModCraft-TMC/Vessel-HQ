package snapshot

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"

	"github.com/moby/moby/api/types/system"
	"github.com/stretchr/testify/require"
)

func TestDockerSnapshotVersionComponents(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name       string
		apiVersion string
		component  string
		podman     bool
	}{
		{name: "modern Docker Engine", apiVersion: "1.54", component: "Engine"},
		{name: "Podman Engine", apiVersion: "1.41", component: "Podman Engine", podman: true},
		{name: "case insensitive Podman", apiVersion: "1.41", component: "pOdMaN Engine", podman: true},
		{name: "other component is not Podman", apiVersion: "1.54", component: "containerd"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			component := system.ComponentVersion{Name: tc.component, Version: "29.0.0", Details: map[string]string{
				"GitCommit": "component-commit", "GoVersion": "component-go", "KernelVersion": "component-kernel", "BuildTime": "component-time",
			}}
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", tc.apiVersion)
					return
				}
				if r.URL.Path != "/v"+tc.apiVersion+"/version" {
					http.Error(w, "unexpected request", http.StatusBadRequest)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(system.VersionResponse{
					Platform: system.PlatformInfo{Name: "engine platform"}, Version: "29.0.0", APIVersion: tc.apiVersion,
					MinAPIVersion: "1.24", Os: "linux", Arch: "arm64", Experimental: true,
					Components: []system.ComponentVersion{component},
				})
			}))
			defer srv.Close()
			cli, err := dockerclient.NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: srv.URL}, "", nil)
			require.NoError(t, err)
			defer cli.Close()
			snap := &portainer.DockerSnapshot{}
			require.NoError(t, dockerSnapshotVersion(snap, cli))
			v := snap.SnapshotRaw.Version
			require.Equal(t, tc.podman, snap.IsPodman)
			require.Equal(t, []system.ComponentVersion{component}, v.Components)
			require.Equal(t, "engine platform", v.Platform.Name)
			require.Equal(t, "29.0.0", v.Version)
			require.Equal(t, tc.apiVersion, v.APIVersion)
			require.Equal(t, "1.24", v.MinAPIVersion)
			require.Equal(t, "linux", v.Os)
			require.Equal(t, "arm64", v.Arch)
			require.True(t, v.Experimental)
			if tc.component == "Engine" {
				require.Equal(t, "component-commit", v.GitCommit)
				require.Equal(t, "component-go", v.GoVersion)
				require.Equal(t, "component-kernel", v.KernelVersion)
				require.Equal(t, "component-time", v.BuildTime)
			} else {
				require.Empty(t, v.GitCommit, "do not mistake another component for Docker Engine diagnostics")
			}
		})
	}
}

func TestDockerSnapshotVersionErrorsDoNotMutateSnapshot(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name   string
		status int
		body   string
	}{
		{name: "daemon error", status: http.StatusInternalServerError, body: `{"message":"version unavailable"}`},
		{name: "Podman error", status: http.StatusNotFound, body: `{"message":"Podman version unavailable"}`},
		{name: "malformed JSON", status: http.StatusOK, body: `{"Version":`},
		{name: "empty response", status: http.StatusOK},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", "1.41")
					return
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.status)
				_, _ = fmt.Fprint(w, tc.body)
			}))
			defer srv.Close()
			cli, err := dockerclient.NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: srv.URL}, "", nil)
			require.NoError(t, err)
			defer cli.Close()
			snap := &portainer.DockerSnapshot{IsPodman: true}
			snap.SnapshotRaw.Version.GitCommit = "previous"
			before := *snap
			require.Error(t, dockerSnapshotVersion(snap, cli))
			require.Equal(t, before, *snap)
		})
	}
}

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
			wire, err := json.Marshal(v)
			require.NoError(t, err)
			for _, field := range []string{"GitCommit", "GoVersion", "KernelVersion", "BuildTime"} {
				require.Contains(t, string(wire), `"`+field+`":`, "preserve snapshot/datastore JSON names")
			}
			require.EqualValues(t, 1, calls.Load(), "capture must not issue another request")
		})
	}
}
