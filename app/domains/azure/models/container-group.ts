import type { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

export type AzureContainerOperatingSystem = 'Linux' | 'Windows';

export interface ContainerGroupContainer {
  name: string;
  properties: {
    environmentVariables?: Array<{
      name: string;
      value?: string;
      secureValue?: string;
    }>;
    image: string;
    ports: Array<{ port: number }>;
    resources: {
      cpu: number;
      memoryInGB: number;
    };
  };
}

export interface ContainerGroup {
  id: string;
  name: string;
  location: string;
  type: string;
  properties: {
    containers: Array<ContainerGroupContainer | undefined>;
    instanceView: {
      events: unknown[];
      state: string;
    };
    ipAddress: {
      dnsNameLabelReusePolicy: string;
      ports: Array<{ port: number; protocol: 'TCP' | 'UDP' }>;
      type: 'Public' | 'Private';
      ip: string;
    };
    osType: AzureContainerOperatingSystem;
  };
  resourceControl?: ResourceControlViewModel;
  isPortainer?: boolean;
}
