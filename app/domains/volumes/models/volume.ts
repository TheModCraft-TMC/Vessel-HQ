import { Volume as DockerVolume } from '@/providers/infrastructure/docker';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';

export interface VolumeModel {
  Id: string;
  Name: DockerVolume['Name'];
  CreatedAt?: DockerVolume['CreatedAt'];
  Driver: DockerVolume['Driver'];
  Options: DockerVolume['Options'];
  Labels: DockerVolume['Labels'];
  Mountpoint: DockerVolume['Mountpoint'];
  ResourceId?: string;
  NodeName?: string;
  StackName?: string;
  ResourceControl?: ResourceControlViewModel;
}

export class VolumeViewModel implements IResource {
  Id: string;

  Name: DockerVolume['Name'];

  CreatedAt?: DockerVolume['CreatedAt'];

  Driver: DockerVolume['Driver'];

  Options: DockerVolume['Options'];

  Labels: DockerVolume['Labels'];

  Mountpoint: DockerVolume['Mountpoint'];

  // Portainer properties

  ResourceId?: string;

  NodeName?: string;

  StackName?: string;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: VolumeModel) {
    this.Name = data.Name;
    this.CreatedAt = data.CreatedAt;
    this.Driver = data.Driver;
    this.Options = data.Options;
    this.Labels = data.Labels;
    if (this.Labels && this.Labels['com.docker.compose.project']) {
      this.StackName = this.Labels['com.docker.compose.project'];
    } else if (this.Labels && this.Labels['com.docker.stack.namespace']) {
      this.StackName = this.Labels['com.docker.stack.namespace'];
    }
    this.Mountpoint = data.Mountpoint;

    this.ResourceId = data.ResourceId;
    this.NodeName = data.NodeName;
    this.ResourceControl = data.ResourceControl;

    this.Id = data.Id;
    if (this.NodeName) {
      this.Id = `${data.Name}-${this.NodeName}`;
    }
  }
}
