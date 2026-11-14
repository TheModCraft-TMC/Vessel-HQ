package delivery

import (
	"context"
	"errors"
	moby "github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/images"
	"sort"
	"strings"
	"sync"
	"time"
)

func UpdatePolicy(labels map[string]string) string {
	if labels["com.centurylinklabs.watchtower.enable"] == "false" || labels["com.getarcaneapp.arcane.update-check"] == "false" || labels["io.vesselhq.updates.enabled"] == "false" {
		return "excluded"
	}
	if labels["com.centurylinklabs.watchtower.monitor-only"] == "true" {
		return "monitor-only"
	}
	return "manual"
}
func ReadImages(ctx context.Context, store dataservices.DataStore, factory *dockerclient.ClientFactory, environmentID, stackID int) (Snapshot, error) {
	result, err := Read(ctx, store, environmentID, stackID)
	if err != nil {
		return result, err
	}
	if factory == nil {
		return result, errors.New("Docker adapter unavailable")
	}
	stack, err := store.Stack().Read(portainer.StackID(stackID))
	if err != nil {
		return result, err
	}
	endpoint, err := store.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return result, err
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	timeout := 10 * time.Second
	client, err := factory.CreateClientWithContext(ctx, endpoint, "", &timeout)
	if err != nil {
		return result, err
	}
	defer client.Close()
	if stack.Type == portainer.DockerComposeStack {
		list, err := client.ContainerList(ctx, moby.ContainerListOptions{All: true, Filters: moby.Filters{}.Add("label", "com.docker.compose.project="+stack.Name)})
		if err != nil {
			return result, err
		}
		for _, item := range list.Items {
			if item.Labels["com.docker.compose.project"] != stack.Name {
				continue
			}
			name := item.ID
			if len(item.Names) > 0 {
				name = strings.TrimPrefix(item.Names[0], "/")
			}
			result.Images = append(result.Images, Image{WorkloadID: item.ID, Name: name, Kind: "container", Reference: item.Image, Policy: UpdatePolicy(item.Labels), Status: "unknown"})
		}
	} else {
		list, err := client.ServiceList(ctx, moby.ServiceListOptions{Filters: moby.Filters{}.Add("label", "com.docker.stack.namespace="+stack.Name)})
		if err != nil {
			return result, err
		}
		for _, item := range list.Items {
			if item.Spec.Labels["com.docker.stack.namespace"] != stack.Name {
				continue
			}
			ref := ""
			if item.Spec.TaskTemplate.ContainerSpec != nil {
				ref = item.Spec.TaskTemplate.ContainerSpec.Image
			}
			result.Images = append(result.Images, Image{WorkloadID: item.ID, Name: item.Spec.Name, Kind: "service", Reference: ref, Policy: UpdatePolicy(item.Spec.Labels), Status: "unknown"})
		}
	}
	if len(result.Images) > 100 {
		return result, errors.New("image checks support at most 100 stack workloads")
	}
	checker := images.NewClientWithRegistry(images.NewRegistryClient(store), factory)
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 4)
	for i := range result.Images {
		if result.Images[i].Policy == "excluded" {
			result.Images[i].Status = "skipped"
			continue
		}
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			select {
			case semaphore <- struct{}{}:
			case <-ctx.Done():
				return
			}
			defer func() { <-semaphore }()
			var status images.Status
			var err error
			if result.Images[i].Kind == "service" {
				status, err = checker.ServiceImageStatus(ctx, result.Images[i].WorkloadID, endpoint)
			} else {
				status, err = checker.ContainerImageStatus(ctx, result.Images[i].WorkloadID, endpoint, "")
			}
			if err != nil {
				result.Images[i].Status = "error"
			} else {
				result.Images[i].Status = string(status)
			}
		}(i)
	}
	wg.Wait()
	sort.Slice(result.Images, func(i, j int) bool { return result.Images[i].WorkloadID < result.Images[j].WorkloadID })
	if err := ctx.Err(); err != nil {
		return result, err
	}
	return result, nil
}
