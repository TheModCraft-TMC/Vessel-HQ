import { Secret, DockerPortainerResponse } from '@/providers/infrastructure/docker';
import { ResourceControlViewModel } from '@/domains/access-control';
import { IResource } from '@/domains/access-control';

type ResourceControlResponse = ConstructorParameters<
  typeof ResourceControlViewModel
>[0];

export class SecretViewModel implements IResource {
  Id: string;

  CreatedAt: string;

  UpdatedAt: string;

  Version: number;

  Name: string;

  Labels: Record<string, string>;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: DockerPortainerResponse<Secret, ResourceControlResponse>) {
    this.Id = data.ID || '';
    this.CreatedAt = data.CreatedAt || '';
    this.UpdatedAt = data.UpdatedAt || '';
    this.Version = data.Version?.Index || 0;
    this.Name = data.Spec?.Name || '';
    this.Labels = data.Spec?.Labels || {};

    if (data.Portainer?.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(
        data.Portainer.ResourceControl
      );
    }
  }
}
