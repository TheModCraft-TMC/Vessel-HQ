import {
  DockerPortainerResponse,
  Volume as DockerVolume,
} from '@/providers/infrastructure/docker';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { VolumeModel } from '../models/volume';

type ResourceControlResponse = ConstructorParameters<
  typeof ResourceControlViewModel
>[0];

type VolumeResponse = DockerPortainerResponse<
  DockerVolume,
  ResourceControlResponse
> & {
  ResourceID?: string;
};

export function toVolume(response: VolumeResponse): VolumeModel {
  const labels = response.Labels;
  const resourceControl = response.Portainer?.ResourceControl;

  return {
    Id: response.Portainer?.Agent?.NodeName
      ? `${response.Name}-${response.Portainer.Agent.NodeName}`
      : response.Name,
    Name: response.Name,
    CreatedAt: response.CreatedAt,
    Driver: response.Driver,
    Options: response.Options,
    Labels: labels,
    Mountpoint: response.Mountpoint,
    ResourceId: response.ResourceID,
    NodeName: response.Portainer?.Agent?.NodeName,
    StackName:
      labels?.['com.docker.compose.project'] ||
      labels?.['com.docker.stack.namespace'],
    ResourceControl: resourceControl
      ? new ResourceControlViewModel(resourceControl)
      : undefined,
  };
}
