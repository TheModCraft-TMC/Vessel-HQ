import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import { Environment, EnvironmentId } from '@/domains/environments';

import { getDeploymentOptions, getEndpoint } from '../environment.service';

import { environmentQueryKeys } from './query-keys';

export function useEnvironment<T = Environment>(
  environmentId?: EnvironmentId,
  select?: (environment: Environment) => T,
  options?: {
    autoRefreshRate?: number;
    excludeSnapshot?: boolean;
  }
) {
  return useQuery(
    environmentQueryKeys.item(environmentId!),
    () => getEndpoint(environmentId!, options?.excludeSnapshot ?? undefined),
    {
      select,
      ...withError('Failed loading environment'),
      staleTime: 50,
      enabled: !!environmentId,
    }
  );
}

export function useEnvironmentDeploymentOptions(id: EnvironmentId | undefined) {
  return useQuery(
    [...environmentQueryKeys.item(id!), 'deploymentOptions'],
    () => getDeploymentOptions(id!),
    {
      enabled: !!id,
      ...withError('Failed loading deployment options'),
    }
  );
}
