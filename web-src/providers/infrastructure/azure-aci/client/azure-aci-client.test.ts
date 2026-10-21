import axios from '@/shared/http';

import { AzureContainerGroupDto } from '../dto/container-group';

import { azureAciClient } from './azure-aci-client';

afterEach(() => vi.restoreAllMocks());

describe('azureAciClient', () => {
  test('creates a container group with the ARM payload and API version', async () => {
    const response = createContainerGroupResponse();
    const put = vi.spyOn(axios, 'put').mockResolvedValue({ data: response });

    await expect(
      azureAciClient.createContainerGroup(
        {
          name: 'example',
          location: 'eastus',
          image: 'nginx:latest',
          os: 'Linux',
          memory: 1,
          cpu: 1,
          ports: [{ container: 80, host: 8080, protocol: 'TCP' }],
          allocatePublicIP: true,
          env: [{ name: 'MODE', value: 'production' }],
        },
        5,
        'subscription',
        'resource-group'
      )
    ).resolves.toEqual(response);

    expect(put).toHaveBeenCalledWith(
      '/endpoints/5/azure/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.ContainerInstance/containerGroups/example',
      expect.objectContaining({
        location: 'eastus',
        properties: expect.objectContaining({ osType: 'Linux' }),
      }),
      { params: { 'api-version': '2018-04-01' } }
    );
  });

  test('loads Azure subscriptions, resource groups, and provider metadata', async () => {
    const subscription = {
      subscriptionId: 'subscription',
      displayName: 'Demo',
    };
    const resourceGroup = {
      id: '/subscriptions/subscription/resourceGroups/resource-group',
      name: 'resource-group',
      location: 'eastus',
      subscriptionId: 'subscription',
    };
    const provider = {
      id: 'provider-id',
      namespace: 'Microsoft.ContainerInstance',
      resourceTypes: [
        { resourceType: 'containerGroups', locations: ['eastus'] },
      ],
    };
    const get = vi
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { value: [subscription] } })
      .mockResolvedValueOnce({ data: subscription })
      .mockResolvedValueOnce({ data: { value: [resourceGroup] } })
      .mockResolvedValueOnce({ data: resourceGroup })
      .mockResolvedValueOnce({ data: provider });

    await expect(azureAciClient.getSubscriptions(5)).resolves.toEqual([
      subscription,
    ]);
    await expect(
      azureAciClient.getSubscription(5, 'subscription')
    ).resolves.toEqual(subscription);
    await expect(
      azureAciClient.getResourceGroups(5, 'subscription')
    ).resolves.toEqual([resourceGroup]);
    await expect(
      azureAciClient.getResourceGroup(5, 'subscription', 'resource-group')
    ).resolves.toEqual(resourceGroup);
    await expect(azureAciClient.getProvider(5, 'subscription')).resolves.toEqual(
      provider
    );

    expect(get.mock.calls.map(([, config]) => config?.params)).toEqual([
      { 'api-version': '2016-06-01' },
      { 'api-version': '2016-06-01' },
      { 'api-version': '2018-02-01' },
      { 'api-version': '2018-02-01' },
      { 'api-version': '2018-02-01' },
    ]);
  });

  test('loads one container group', async () => {
    const response = createContainerGroupResponse();
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: response });

    await expect(
      azureAciClient.getContainerGroup(
        5,
        'subscription',
        'resource-group',
        'example'
      )
    ).resolves.toEqual(response);

    expect(get).toHaveBeenCalledWith(
      '/endpoints/5/azure/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.ContainerInstance/containerGroups/example',
      { params: { 'api-version': '2018-04-01' } }
    );
  });

  test('loads all container groups for a subscription', async () => {
    const response = createContainerGroupResponse();
    const get = vi
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { value: [response] } });

    await expect(
      azureAciClient.getContainerGroups(5, 'subscription')
    ).resolves.toEqual([response]);

    expect(get).toHaveBeenCalledWith(
      '/endpoints/5/azure/subscriptions/subscription/providers/Microsoft.ContainerInstance/containerGroups',
      { params: { 'api-version': '2018-04-01' } }
    );
  });

  test('deletes a container group by its Azure resource id', async () => {
    const deleteRequest = vi
      .spyOn(axios, 'delete')
      .mockResolvedValue({ data: undefined });

    await azureAciClient.deleteContainerGroup(
      5,
      '/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.ContainerInstance/containerGroups/example'
    );

    expect(deleteRequest).toHaveBeenCalledWith(
      '/endpoints/5/azure/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.ContainerInstance/containerGroups/example',
      { params: { 'api-version': '2018-04-01' } }
    );
  });
});

function createContainerGroupResponse(): AzureContainerGroupDto {
  return {
    id: '/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.ContainerInstance/containerGroups/example',
    name: 'example',
    location: 'eastus',
    type: 'Microsoft.ContainerInstance/containerGroups',
    properties: {
      containers: [
        {
          name: 'example',
          properties: {
            image: 'nginx:latest',
            ports: [{ port: 80 }],
            resources: { cpu: 1, memoryInGB: 1 },
          },
        },
      ],
      instanceView: { events: [], state: 'Running' },
      ipAddress: {
        dnsNameLabelReusePolicy: 'Unsecure',
        ports: [{ port: 8080, protocol: 'TCP' }],
        type: 'Public',
        ip: '192.0.2.1',
      },
      osType: 'Linux',
    },
  };
}
