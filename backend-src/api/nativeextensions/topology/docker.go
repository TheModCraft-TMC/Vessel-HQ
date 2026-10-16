package topology

import (
	"context"
	"errors"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"sort"
	"strings"
	"time"
)

type dockerReader interface {
	ContainerList(context.Context, container.ListOptions) ([]container.Summary, error)
	ServiceList(context.Context, types.ServiceListOptions) ([]swarm.Service, error)
	NetworkInspect(context.Context, string, network.InspectOptions) (network.Inspect, error)
}

// ReadDocker queries only stack-labelled workloads and networks attached to those
// workloads. Provider DTOs, labels, environment variables and other network members
// never cross the extension API boundary.
func ReadDocker(ctx context.Context, store dataservices.DataStore, factory *dockerclient.ClientFactory, environmentID, stackID int) (Graph, error) {
	result := Graph{EnvironmentID: environmentID, StackID: stackID, Networks: []Network{}, Workloads: []Workload{}}
	stack, err := store.Stack().Read(portainer.StackID(stackID))
	if err != nil {
		return result, err
	}
	if int(stack.EndpointID) != environmentID || stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack {
		return result, errors.New("unsupported stack or environment mismatch")
	}
	endpoint, err := store.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return result, err
	}
	if factory == nil {
		return result, errors.New("Docker adapter unavailable")
	}
	timeout := 15 * time.Second
	client, err := factory.CreateClient(endpoint, "", &timeout)
	if err != nil {
		return result, err
	}
	defer client.Close()
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	return readDockerStack(ctx, stack, client)
}
func readDockerStack(ctx context.Context, stack *portainer.Stack, client dockerReader) (Graph, error) {
	result := Graph{EnvironmentID: int(stack.EndpointID), StackID: int(stack.ID), Name: stack.Name, Networks: []Network{}, Workloads: []Workload{}}
	result.Name = stack.Name
	networkTargets := map[string]bool{}
	if stack.Type == portainer.DockerComposeStack {
		workloads, err := client.ContainerList(ctx, container.ListOptions{All: true, Filters: filters.NewArgs(filters.Arg("label", "com.docker.compose.project="+stack.Name))})
		if err != nil {
			return result, err
		}
		if len(workloads) > 500 {
			return result, errors.New("stack topology exceeds workload limit")
		}
		for _, item := range workloads {
			if item.Labels["com.docker.compose.project"] != stack.Name {
				continue
			}
			workload := Workload{ID: item.ID, Name: strings.TrimPrefix(item.ID, "/"), Kind: "container", State: item.State, Networks: []Attachment{}}
			if len(item.Names) > 0 {
				workload.Name = strings.TrimPrefix(item.Names[0], "/")
			}
			if item.NetworkSettings != nil {
				for _, attachment := range item.NetworkSettings.Networks {
					if attachment != nil && attachment.NetworkID != "" {
						networkTargets[attachment.NetworkID] = true
						workload.Networks = append(workload.Networks, Attachment{NetworkID: attachment.NetworkID})
					}
				}
			}
			result.Workloads = append(result.Workloads, workload)
		}
	} else {
		workloads, err := client.ServiceList(ctx, types.ServiceListOptions{Filters: filters.NewArgs(filters.Arg("label", "com.docker.stack.namespace="+stack.Name))})
		if err != nil {
			return result, err
		}
		if len(workloads) > 500 {
			return result, errors.New("stack topology exceeds workload limit")
		}
		for _, item := range workloads {
			if item.Spec.Labels["com.docker.stack.namespace"] != stack.Name {
				continue
			}
			workload := Workload{ID: item.ID, Name: item.Spec.Name, Kind: "service", Networks: []Attachment{}}
			for _, attachment := range item.Spec.TaskTemplate.Networks {
				if attachment.Target != "" {
					networkTargets[attachment.Target] = true
					workload.Networks = append(workload.Networks, Attachment{NetworkID: attachment.Target})
				}
			}
			result.Workloads = append(result.Workloads, workload)
		}
	}
	attachments := 0
	for _, workload := range result.Workloads {
		attachments += len(workload.Networks)
	}
	if attachments > 2048 {
		return result, errors.New("stack topology exceeds attachment limit")
	}
	if len(networkTargets) > 256 {
		return result, errors.New("stack topology exceeds network limit")
	}
	resolved := map[string]string{}
	for target := range networkTargets {
		item, err := client.NetworkInspect(ctx, target, network.InspectOptions{})
		if err != nil {
			return result, errors.New("cannot resolve stack network metadata")
		}
		if item.ID == "" || (item.ID != target && item.Name != target) {
			return result, errors.New("invalid network identity")
		}
		resolved[target] = item.ID
		found := false
		for _, existing := range result.Networks {
			if existing.ID == item.ID {
				found = true
			}
		}
		if !found {
			result.Networks = append(result.Networks, Network{ID: item.ID, Name: item.Name, Driver: item.Driver, Scope: item.Scope, Internal: item.Internal})
		}
	}
	for i := range result.Workloads {
		for j := range result.Workloads[i].Networks {
			result.Workloads[i].Networks[j].NetworkID = resolved[result.Workloads[i].Networks[j].NetworkID]
		}
		sort.Slice(result.Workloads[i].Networks, func(a, b int) bool {
			return result.Workloads[i].Networks[a].NetworkID < result.Workloads[i].Networks[b].NetworkID
		})
	}
	sort.Slice(result.Networks, func(a, b int) bool { return result.Networks[a].ID < result.Networks[b].ID })
	sort.Slice(result.Workloads, func(a, b int) bool { return result.Workloads[a].ID < result.Workloads[b].ID })
	return result, nil
}
