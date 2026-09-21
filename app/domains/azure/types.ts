import {
  AccessControlFormData,
  ResourceControlResponse,
} from '@/react/portainer/access-control/types';

import { PortMapping } from './container-instances/CreateView/PortsMappingField';

type AzureContainerOperatingSystem = 'Linux' | 'Windows';

export interface ContainerInstanceFormValues {
  name: string;
  location?: string;
  subscription?: string;
  resourceGroup?: string;
  image: string;
  os: AzureContainerOperatingSystem;
  memory: number;
  cpu: number;
  ports: PortMapping[];
  allocatePublicIP: boolean;
  accessControl: AccessControlFormData;
  env: { name: string; value: string }[];
}

interface Container {
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

interface ContainerGroupProperties {
  containers: Array<Container | undefined>;
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
}

export interface ContainerGroup {
  id: string;
  name: string;
  location: string;
  type: string;
  properties: ContainerGroupProperties;
  Portainer?: {
    ResourceControl?: ResourceControlResponse;
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
}

export interface Subscription {
  subscriptionId: string;
  displayName: string;
}

export interface ResourceGroup {
  id: string;
  name: string;
  location: string;
  subscriptionId: string;
}

export interface ProviderViewModel {
  id: string;
  namespace: string;
  locations: string[];
}
