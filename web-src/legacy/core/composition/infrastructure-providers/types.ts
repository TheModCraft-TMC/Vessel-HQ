import type { AzureAciClient } from '@/providers/infrastructure/azure-aci';
import type { DockerClient } from '@/providers/infrastructure/docker';
import type { EdgeAgentCapabilities } from '@/providers/infrastructure/edge-agent';
import type { KubernetesClient } from '@/providers/infrastructure/kubernetes';
import type { PodmanClient } from '@/providers/infrastructure/podman';

export type InfrastructureProviderKind =
  | 'docker'
  | 'podman'
  | 'kubernetes'
  | 'azure-aci'
  | 'edge-agent';

export interface InfrastructureProviders {
  docker: DockerClient;
  podman: PodmanClient;
  kubernetes: KubernetesClient;
  azureAci: AzureAciClient;
  edgeAgent: EdgeAgentCapabilities;
}
