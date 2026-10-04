import { DockerNetworkDto } from '@/providers/infrastructure/docker';

import {
  DockerNetwork,
  IPConfig,
  NetworkResponseContainers,
} from '../models/network';

export function toNetwork(dto: DockerNetworkDto): DockerNetwork {
  return {
    ...dto,
    Portainer: dto.Portainer as DockerNetwork['Portainer'],
    Name: dto.Name || '',
    Id: dto.Id || '',
    Driver: dto.Driver || '',
    Scope: dto.Scope || '',
    Attachable: dto.Attachable ?? false,
    Internal: dto.Internal ?? false,
    IPAM: toIpam(dto.IPAM),
    Options: dto.Options ?? {},
    Containers: toContainers(dto.Containers),
  };
}

function toContainers(
  containers: DockerNetworkDto['Containers']
): NetworkResponseContainers {
  if (!containers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(containers).map(([id, container]) => [
      id,
      {
        EndpointID: container.EndpointID ?? '',
        IPv4Address: container.IPv4Address ?? '',
        IPv6Address: container.IPv6Address ?? '',
        MacAddress: container.MacAddress ?? '',
        Name: container.Name ?? '',
      },
    ])
  );
}

function toIpam(ipam: DockerNetworkDto['IPAM']): DockerNetwork['IPAM'] {
  if (!ipam) {
    return { Config: [], Driver: '', Options: {} };
  }

  return {
    Config: ipam.Config?.map(toIpamConfig) ?? [],
    Driver: ipam.Driver || '',
    Options: ipam.Options,
  };
}

function toIpamConfig(
  config: NonNullable<NonNullable<DockerNetworkDto['IPAM']>['Config']>[number]
): IPConfig {
  return {
    ...config,
    Subnet: config.Subnet ?? '',
    Gateway: config.Gateway ?? '',
  };
}
