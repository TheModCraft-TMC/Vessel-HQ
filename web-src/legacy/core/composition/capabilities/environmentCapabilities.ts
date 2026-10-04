import { EnvironmentType } from '@/domains/environments';

import type { EnvironmentCapabilities, EnvironmentDescriptor } from './types';

export function getEnvironmentCapabilities({
  Type,
}: EnvironmentDescriptor): EnvironmentCapabilities {
  const isKubernetes =
    Type === EnvironmentType.KubernetesLocal ||
    Type === EnvironmentType.AgentOnKubernetes;
  const isEdge =
    Type === EnvironmentType.EdgeAgentOnDocker ||
    Type === EnvironmentType.EdgeAgentOnKubernetes;

  return {
    environmentType: Type,
    supportsContainerOperations: !isKubernetes && !isEdge,
    supportsKubernetesOperations: isKubernetes,
    supportsRegistryOperations: !isEdge,
    supportsEdgeOperations: isEdge,
    supportsAzureOperations: Type === EnvironmentType.Azure,
  };
}
