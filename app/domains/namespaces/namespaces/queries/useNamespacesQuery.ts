import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { kubernetesClient } from '@/providers/infrastructure/kubernetes';

import { PortainerNamespace } from '../types';

import { queryKeys } from './queryKeys';

export function useNamespacesQuery<T = PortainerNamespace[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    withResourceQuota?: boolean;
    withUnhealthyEvents?: boolean;
    select?: (namespaces: PortainerNamespace[]) => T;
  }
) {
  return useQuery(
    queryKeys.list(environmentId, {
      withResourceQuota: !!options?.withResourceQuota,
      withUnhealthyEvents: !!options?.withUnhealthyEvents,
    }),
    () =>
      kubernetesClient.listNamespaces(environmentId, {
        withResourceQuota: options?.withResourceQuota,
        withUnhealthyEvents: options?.withUnhealthyEvents,
      }),
    {
      ...withError('Unable to get namespaces.'),
      select: options?.select,
    }
  );
}

// getNamespaces is used to retrieve namespaces using the Portainer backend with caching
export const getNamespaces = kubernetesClient.listNamespaces;
