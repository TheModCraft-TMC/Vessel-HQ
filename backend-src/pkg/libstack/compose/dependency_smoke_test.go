package compose_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	portainer "github.com/portainer/portainer/api"
	factory "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

// Opt in with an explicitly isolated engine, never the developer's default
// Docker context. All resources belong to this one project and are cleaned up.
func TestDependencyRuntimeSmoke(t *testing.T) {
	host := os.Getenv("VESSEL_DEPENDENCY_DOCKER_HOST")
	if host == "" {
		t.Skip("requires an explicitly isolated disposable Docker engine")
	}
	const project = "vessel-dep-go-smoke"
	cli, err := factory.NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{Type: portainer.DockerEnvironment, URL: host}, "", nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, cli.Close()) })
	info, err := cli.Info(t.Context(), client.InfoOptions{})
	require.NoError(t, err)
	require.NotEmpty(t, info.Info.ServerVersion)
	t.Logf("engine=%s negotiated API=%s", info.Info.ServerVersion, cli.ClientVersion())

	dir := t.TempDir()
	file := filepath.Join(dir, "compose.yaml")
	require.NoError(t, os.WriteFile(file, []byte(`services:
  app:
    image: alpine:3.20
    command: ["sh", "-c", "echo vessel-dep-go-ready; sleep 300"]
    volumes:
      - data:/data
volumes:
  data: {}
`), 0o600))
	d := compose.NewComposeDeployer()
	opts := libstack.Options{Host: host, ProjectName: project, WorkingDir: dir}
	t.Cleanup(func() {
		require.NoError(t, d.Remove(context.Background(), project, []string{file}, libstack.RemoveOptions{Options: opts, Volumes: true}))
	})
	require.NoError(t, d.Validate(t.Context(), []string{file}, opts))
	require.NoError(t, d.Pull(t.Context(), []string{file}, opts))

	// Both deployment and teardown must retain WithoutCancel after the Compose
	// constructor migration. A cancelled HTTP request must not abort halfway.
	detached, cancel := context.WithCancel(t.Context())
	cancel()
	require.NoError(t, d.Deploy(detached, []string{file}, libstack.DeployOptions{Options: opts}))
	filter := make(client.Filters).Add("label", "com.docker.compose.project="+project)
	containers, err := cli.ContainerList(t.Context(), client.ContainerListOptions{All: true, Filters: filter})
	require.NoError(t, err)
	require.Len(t, containers.Items, 1)
	inspection, err := cli.ContainerInspect(t.Context(), containers.Items[0].ID, client.ContainerInspectOptions{})
	require.NoError(t, err)
	require.True(t, inspection.Container.State.Running)
	require.NotEmpty(t, inspection.Container.NetworkSettings.Networks)
	require.Len(t, inspection.Container.Mounts, 1)
	require.Equal(t, "volume", string(inspection.Container.Mounts[0].Type))
	require.NoError(t, d.Run(t.Context(), []string{file}, "app", libstack.RunOptions{Options: opts, Args: []string{"echo", "vessel-dep-go-oneoff"}, Remove: true}))
	require.NoError(t, d.Remove(detached, project, []string{file}, libstack.RemoveOptions{Options: opts, Volumes: true}))
	containers, err = cli.ContainerList(t.Context(), client.ContainerListOptions{All: true, Filters: filter})
	require.NoError(t, err)
	require.Empty(t, containers.Items)
	volumes, err := cli.VolumeList(t.Context(), client.VolumeListOptions{Filters: filter})
	require.NoError(t, err)
	require.Empty(t, volumes.Items)
}
