import { azureAciClient } from '@/providers/infrastructure/azure-aci';
import { edgeAgentCapabilities } from '@/providers/infrastructure/edge-agent';
import {
  createDockerClient,
  type DockerHttpTransport,
} from '@/providers/infrastructure/docker';
import {
  createKubernetesClient,
  type KubernetesHttpTransport,
} from '@/providers/infrastructure/kubernetes';
import { createPodmanClient } from '@/providers/infrastructure/podman';

import type { InfrastructureProviders } from './types';

export function createInfrastructureProviders(
  http: DockerHttpTransport,
  normalizeError: (error: unknown, message?: string) => Error,
  kubernetesHttp: KubernetesHttpTransport
): InfrastructureProviders {
  const docker = createDockerClient({ http, normalizeError });

  return {
    docker,
    podman: createPodmanClient(docker),
    kubernetes: createKubernetesClient(kubernetesHttp),
    azureAci: azureAciClient,
    edgeAgent: edgeAgentCapabilities,
  };
}
