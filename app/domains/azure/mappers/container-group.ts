import { AzureContainerGroupDto } from '@/providers/infrastructure/azure-aci';

import { ContainerGroup } from '../types';

export function toContainerGroup(
  containerGroup: AzureContainerGroupDto
): ContainerGroup {
  return {
    id: containerGroup.id,
    name: containerGroup.name,
    location: containerGroup.location,
    type: containerGroup.type,
    properties: {
      containers: containerGroup.properties.containers.map((container) =>
        container
          ? {
              name: container.name,
              properties: {
                environmentVariables:
                  container.properties.environmentVariables?.map(
                    (environmentVariable) => ({ ...environmentVariable })
                  ),
                image: container.properties.image,
                ports: container.properties.ports.map((port) => ({ ...port })),
                resources: { ...container.properties.resources },
              },
            }
          : undefined
      ),
      instanceView: {
        events: [...containerGroup.properties.instanceView.events],
        state: containerGroup.properties.instanceView.state,
      },
      ipAddress: {
        ...containerGroup.properties.ipAddress,
        ports: containerGroup.properties.ipAddress.ports.map((port) => ({
          ...port,
        })),
      },
      osType: containerGroup.properties.osType,
    },
    Portainer: containerGroup.Portainer
      ? {
          Agent: containerGroup.Portainer.Agent
            ? { ...containerGroup.Portainer.Agent }
            : undefined,
          ResourceControl: containerGroup.Portainer.ResourceControl
            ? { ...containerGroup.Portainer.ResourceControl }
            : undefined,
        }
      : undefined,
    IsPortainer: containerGroup.IsPortainer,
  };
}
