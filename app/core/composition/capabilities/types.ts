import type { EnvironmentType } from '@/domains/environments';

export interface EnvironmentCapabilities {
  environmentType: EnvironmentType;
  supportsContainerOperations: boolean;
  supportsKubernetesOperations: boolean;
  supportsRegistryOperations: boolean;
  supportsEdgeOperations: boolean;
  supportsAzureOperations: boolean;
}

export interface EnvironmentDescriptor {
  Type: EnvironmentType;
}
