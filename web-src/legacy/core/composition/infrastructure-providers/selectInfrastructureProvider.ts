import { EnvironmentType } from '@/domains/environments';

import type { InfrastructureProviderKind } from './types';

export function selectInfrastructureProvider(
  environmentType: EnvironmentType
): InfrastructureProviderKind {
  switch (environmentType) {
    case EnvironmentType.Azure:
      return 'azure-aci';
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
      return 'kubernetes';
    case EnvironmentType.EdgeAgentOnDocker:
    case EnvironmentType.EdgeAgentOnKubernetes:
      return 'edge-agent';
    case EnvironmentType.Docker:
    case EnvironmentType.AgentOnDocker:
    default:
      return 'docker';
  }
}
