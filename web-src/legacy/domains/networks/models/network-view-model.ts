import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { DockerNetwork } from './network';

export class NetworkViewModel implements DockerNetwork {
  Id: string;
  Name: string;
  Scope: string;
  Driver: string;
  Attachable: boolean;
  Internal: boolean;
  IPAM: DockerNetwork['IPAM'];
  Containers: DockerNetwork['Containers'];
  Options: DockerNetwork['Options'];
  Ingress?: boolean;
  Labels?: Record<string, string>;
  StackName?: string;
  NodeName?: string;
  ConfigFrom?: { Network: string };
  ConfigOnly?: boolean;
  Portainer?: DockerNetwork['Portainer'];
  IsPortainer?: boolean;
  ResourceControl?: {
    Id?: number;
    System?: boolean;
    Ownership: ResourceControlOwnership;
    [key: string]: unknown;
  };

  constructor(data: DockerNetwork) {
    Object.assign(this, data);
    this.Id = data.Id || '';
    this.Name = data.Name || '';
    this.Scope = data.Scope || '';
    this.Driver = data.Driver || '';
    this.Attachable = data.Attachable || false;
    this.Internal = data.Internal || false;
    this.IPAM = data.IPAM;
    this.Containers = data.Containers;
    this.Options = data.Options;
    this.Ingress = data.Ingress || false;
    const labels = data.Labels || {};
    this.Labels = labels;
    this.StackName =
      labels['com.docker.compose.project'] ||
      labels['com.docker.stack.namespace'];
    this.Portainer = data.Portainer;
    this.ResourceControl = data.Portainer?.ResourceControl as
      | NetworkViewModel['ResourceControl']
      | undefined;
    this.NodeName = data.Portainer?.Agent?.NodeName;
    this.ConfigFrom = data.ConfigFrom;
    this.ConfigOnly = data.ConfigOnly;
    this.IsPortainer = data.IsPortainer;
  }
}
