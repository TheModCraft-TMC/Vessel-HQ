import { AzureContainerGroupDto } from '@/providers/infrastructure/azure-aci';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { ContainerGroup } from '../models';

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
    resourceControl: containerGroup.Portainer?.ResourceControl
      ? new ResourceControlViewModel(containerGroup.Portainer.ResourceControl)
      : undefined,
    isPortainer: containerGroup.IsPortainer,
  };
}
