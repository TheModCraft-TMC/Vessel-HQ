import type { KubernetesHttpTransport } from '@/providers/infrastructure/kubernetes';

import { getEnvironmentCapabilities } from '../capabilities';
import { createInfrastructureProviders } from '../infrastructure-providers';
import { createRemoteProviders } from '../remote-providers';

import type { ApplicationBindings } from './types';

export interface CompositionDependencies {
  http: Parameters<typeof createInfrastructureProviders>[0];
  normalizeError: Parameters<typeof createInfrastructureProviders>[1];
  kubernetesHttp: KubernetesHttpTransport;
}

export function createApplicationBindings({
  http,
  normalizeError,
  kubernetesHttp,
}: CompositionDependencies): ApplicationBindings {
  const infrastructure = createInfrastructureProviders(
    http,
    normalizeError,
    kubernetesHttp
  );

  return {
    infrastructure,
    remotes: createRemoteProviders(),
    capabilities: {
      forEnvironment: getEnvironmentCapabilities,
    },
  };
}
