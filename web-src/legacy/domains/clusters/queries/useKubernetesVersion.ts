import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { kubernetesClient } from '@/providers/infrastructure/kubernetes';

import { queryKeys } from './query-keys';

export function useKubernetesVersion(environmentId: EnvironmentId) {
  return useQuery(
    [...queryKeys.base(environmentId), 'version'] as const,
    () => kubernetesClient.getVersion(environmentId),
    withError('Unable to retrieve Kubernetes cluster version')
  );
}
