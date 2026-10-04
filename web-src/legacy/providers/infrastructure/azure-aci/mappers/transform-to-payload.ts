import {
  AzureContainerGroupPayloadDto,
  CreateAzureContainerGroupInput,
} from '../dto/container-group';

export function transformToPayload(
  model: CreateAzureContainerGroupInput
): AzureContainerGroupPayloadDto {
  const containerPorts: Array<{ port: number }> = [];
  const addressPorts: Array<{
    port: number;
    protocol: 'TCP' | 'UDP';
  }> = [];

  const ports = model.ports.filter(
    (port): port is typeof port & { container: number; host: number } =>
      Boolean(port.container && port.host)
  );

  ports.forEach((binding) => {
    containerPorts.push({
      port: binding.container,
    });

    addressPorts.push({
      port: binding.host,
      protocol: binding.protocol,
    });
  });

  const environmentVariables = model.env.map(({ name, value }) => ({
    name,
    value,
  }));

  return {
    location: model.location,
    properties: {
      osType: model.os,
      containers: [
        {
          name: model.name,
          properties: {
            image: model.image,
            ports: containerPorts,
            environmentVariables,
            resources: {
              requests: {
                cpu: model.cpu,
                memoryInGB: model.memory,
              },
            },
          },
        },
      ],
      ipAddress: {
        type: model.allocatePublicIP ? 'Public' : 'Private',
        ports: addressPorts,
      },
    },
  };
}
