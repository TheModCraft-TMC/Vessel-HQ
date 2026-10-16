package topology

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
	"testing"
)

type fakeDocker struct {
	t         *testing.T
	kind      string
	inspected []string
}

func (f *fakeDocker) ContainerList(_ context.Context, options container.ListOptions) ([]container.Summary, error) {
	require.Contains(f.t, options.Filters.Get("label"), "com.docker.compose.project=target")
	return []container.Summary{{ID: "target-container", Names: []string{"/target-web"}, Labels: map[string]string{"com.docker.compose.project": "target", "credential": "secret-label"}, Command: "secret-command", NetworkSettings: &container.NetworkSettingsSummary{Networks: map[string]*network.EndpointSettings{"app": {NetworkID: "attached"}}}}, {ID: "unrelated-container", Names: []string{"/private-other"}, Labels: map[string]string{"com.docker.compose.project": "other"}, NetworkSettings: &container.NetworkSettingsSummary{Networks: map[string]*network.EndpointSettings{"other": {NetworkID: "unrelated-network"}}}}}, nil
}
func (f *fakeDocker) ServiceList(_ context.Context, options types.ServiceListOptions) ([]swarm.Service, error) {
	require.Contains(f.t, options.Filters.Get("label"), "com.docker.stack.namespace=target")
	return []swarm.Service{{ID: "target-service", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "target-web", Labels: map[string]string{"com.docker.stack.namespace": "target"}}, TaskTemplate: swarm.TaskSpec{Networks: []swarm.NetworkAttachmentConfig{{Target: "attached"}}}}}, {ID: "unrelated-service", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "private-other", Labels: map[string]string{"com.docker.stack.namespace": "other"}}, TaskTemplate: swarm.TaskSpec{Networks: []swarm.NetworkAttachmentConfig{{Target: "unrelated-network"}}}}}}, nil
}
func (f *fakeDocker) NetworkInspect(_ context.Context, id string, _ network.InspectOptions) (network.Inspect, error) {
	f.inspected = append(f.inspected, id)
	require.Equal(f.t, "attached", id)
	return network.Inspect{ID: "attached", Name: "app", Driver: "bridge", Scope: "local", Containers: map[string]network.EndpointResource{"unrelated-container": {Name: "private-member", IPv4Address: "secret-address"}}}, nil
}
func TestDockerTopologyExcludesUnrelatedResourcesAndProviderDetails(t *testing.T) {
	for _, kind := range []portainer.StackType{portainer.DockerComposeStack, portainer.DockerSwarmStack} {
		t.Run(string(rune(kind+'0')), func(t *testing.T) {
			client := &fakeDocker{t: t}
			graph, err := readDockerStack(t.Context(), &portainer.Stack{ID: 2, EndpointID: 1, Name: "target", Type: kind}, client)
			require.NoError(t, err)
			require.Len(t, graph.Workloads, 1)
			require.Len(t, graph.Networks, 1)
			require.Equal(t, []string{"attached"}, client.inspected)
			encoded, err := json.Marshal(graph)
			require.NoError(t, err)
			for _, private := range []string{"unrelated", "private-", "secret-", "credential", "Command", "Containers", "IPv4"} {
				require.NotContains(t, string(encoded), private)
			}
		})
	}
}
