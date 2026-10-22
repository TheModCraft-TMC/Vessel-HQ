package topology

import (
	"context"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/api/types/swarm"
	mobyclient "github.com/moby/moby/client"
)

type dockerAdapter struct{ *mobyclient.Client }

func (d dockerAdapter) ContainerList(ctx context.Context, opts mobyclient.ContainerListOptions) ([]container.Summary, error) {
	result, err := d.Client.ContainerList(ctx, opts)
	return result.Items, err
}
func (d dockerAdapter) ServiceList(ctx context.Context, opts mobyclient.ServiceListOptions) ([]swarm.Service, error) {
	result, err := d.Client.ServiceList(ctx, opts)
	return result.Items, err
}
func (d dockerAdapter) NetworkInspect(ctx context.Context, id string, opts mobyclient.NetworkInspectOptions) (network.Inspect, error) {
	result, err := d.Client.NetworkInspect(ctx, id, opts)
	return result.Network, err
}
func (d dockerAdapter) ContainerStatsOneShot(ctx context.Context, id string) (mobyclient.ContainerStatsResult, error) {
	return d.Client.ContainerStats(ctx, id, mobyclient.ContainerStatsOptions{})
}
