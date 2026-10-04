export type AzureContainerOperatingSystem = 'Linux' | 'Windows';

export type AzureContainerPortProtocol = 'TCP' | 'UDP';

export interface CreateAzureContainerGroupInput {
  name: string;
  location?: string;
  image: string;
  os: AzureContainerOperatingSystem;
  memory: number;
  cpu: number;
  ports: Array<{
    container?: number;
    host?: number;
    protocol: AzureContainerPortProtocol;
  }>;
  allocatePublicIP: boolean;
  env: Array<{ name: string; value: string }>;
}

export interface AzureContainerGroupPayloadDto {
  location?: string;
  properties: {
    osType: AzureContainerOperatingSystem;
    containers: Array<{
      name: string;
      properties: {
        image: string;
        ports: Array<{ port: number }>;
        environmentVariables: Array<{ name: string; value: string }>;
        resources: {
          requests: {
            cpu: number;
            memoryInGB: number;
          };
        };
      };
    }>;
    ipAddress: {
      type: 'Public' | 'Private';
      ports: Array<{
        port: number;
        protocol: AzureContainerPortProtocol;
      }>;
    };
  };
}

interface AzureContainerDto {
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

interface AzureContainerGroupPropertiesDto {
  containers: Array<AzureContainerDto | undefined>;
  instanceView: {
    events: unknown[];
    state: 'pending' | string;
  };
  ipAddress: {
    dnsNameLabelReusePolicy: string;
    ports: Array<{
      port: number;
      protocol: AzureContainerPortProtocol;
    }>;
    type: 'Public' | 'Private';
    ip: string;
  };
  osType: AzureContainerOperatingSystem;
}

interface ResourceControlDto {
  Id: number;
  Type: 8;
  ResourceId: number | string;
  UserAccesses: Array<{ UserId: number; AccessLevel: 0 | 1 | 2 }>;
  TeamAccesses: Array<{ TeamId: number; AccessLevel: 0 | 1 | 2 }>;
  Public: boolean;
  AdministratorsOnly: boolean;
  System: boolean;
}

export interface AzureContainerGroupDto {
  id: string;
  name: string;
  location: string;
  type: string;
  properties: AzureContainerGroupPropertiesDto;
  Portainer?: {
    ResourceControl?: ResourceControlDto;
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
}
