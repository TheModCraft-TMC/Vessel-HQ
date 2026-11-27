package client

import (
	"context"

	"github.com/moby/moby/api/types/system"
	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
)

// ServerVersion retains top-level legacy diagnostics independently of the modern
// component list. The maintained SDK owns the request, decoding and body lifetime.
func ServerVersion(ctx context.Context, cli *client.Client) (portainer.DockerVersion, error) {
	version, err := cli.ServerVersion(ctx, client.ServerVersionOptions{})
	if err != nil {
		return portainer.DockerVersion{}, err
	}
	return portainer.DockerVersion{GitCommit: version.GitCommit, GoVersion: version.GoVersion, VersionResponse: system.VersionResponse{
		Platform: system.PlatformInfo{Name: version.Platform.Name},
		Version:  version.Version, APIVersion: version.APIVersion,
		MinAPIVersion: version.MinAPIVersion, Os: version.Os, Arch: version.Arch,
		Experimental: version.Experimental, Components: version.Components,
		GitCommit: version.GitCommit, GoVersion: version.GoVersion,
		KernelVersion: version.KernelVersion, BuildTime: version.BuildTime,
	}}, nil
}
