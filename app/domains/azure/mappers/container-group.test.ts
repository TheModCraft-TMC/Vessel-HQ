import { AzureContainerGroupDto } from '@/providers/infrastructure/azure-aci';

import { toContainerGroup } from './container-group';

describe('toContainerGroup', () => {
  test('maps an Azure response into a detached domain model', () => {
    const response: AzureContainerGroupDto = {
      id: '/subscriptions/sub/resourceGroups/group/providers/Microsoft.ContainerInstance/containerGroups/example',
      name: 'example',
      location: 'eastus',
      type: 'Microsoft.ContainerInstance/containerGroups',
      properties: {
        containers: [
          {
            name: 'example',
            properties: {
              environmentVariables: [{ name: 'MODE', value: 'production' }],
              image: 'nginx:latest',
              ports: [{ port: 80 }],
              resources: { cpu: 1, memoryInGB: 1 },
            },
          },
        ],
        instanceView: { events: [], state: 'Running' },
        ipAddress: {
          dnsNameLabelReusePolicy: 'Unsecure',
          ports: [{ port: 80, protocol: 'TCP' }],
          type: 'Public',
          ip: '192.0.2.1',
        },
        osType: 'Linux',
      },
    };

    const model = toContainerGroup(response);

    expect(model).toEqual(response);
    expect(model).not.toBe(response);
    expect(model.properties).not.toBe(response.properties);
    expect(model.properties.containers[0]).not.toBe(
      response.properties.containers[0]
    );
  });
});
