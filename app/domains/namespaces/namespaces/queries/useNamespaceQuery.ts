import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { kubernetesClient } from '@/providers/infrastructure/kubernetes';

import { PortainerNamespace } from '../types';

import { queryKeys } from './queryKeys';

type QueryParams = 'withResourceQuota';

export function useNamespaceQuery<T = PortainerNamespace>(
  environmentId: EnvironmentId,
  namespace: string,
  {
    select,
    enabled,
    params,
  }: {
    select?(namespace: PortainerNamespace): T;
    params?: Record<QueryParams, string>;
    enabled?: boolean;
  } = {}
) {
  return useQuery(
    queryKeys.namespace(environmentId, namespace),
    () => kubernetesClient.getNamespace(environmentId, namespace, params),
    {
      enabled: !!environmentId && !!namespace && enabled,
      select,
    }
  );
}

// getNamespace is used to retrieve a namespace using the Portainer backend
export const getNamespace = kubernetesClient.getNamespace;
