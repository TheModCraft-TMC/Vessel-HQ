import { useQuery } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { withError } from '@/core/query';
import { toListViewModel } from '@/domains/containers/utils';
import { queryKeys } from '@/domains/containers/queries/query-keys';
import type { Filters } from '@/domains/containers/queries/types';
import type { EnvironmentId } from '@/domains/environments';

import type { ContainerListViewModel } from '../types';

interface UseContainers {
  all?: boolean;
  filters?: Filters;
  nodeName?: string;
}

export function useContainers<T = ContainerListViewModel[]>(
  environmentId: EnvironmentId | undefined,
  {
    autoRefreshRate: _autoRefreshRate,
    select,
    enabled,
    ...params
  }: UseContainers & {
    autoRefreshRate?: number;
    select?: (data: ContainerListViewModel[]) => T;
    enabled?: boolean;
  } = {}
) {
  // Keep the compatibility option out of the API request and query key.
  void _autoRefreshRate;

  return useQuery(
    queryKeys.filters(environmentId!, params),
    () => getContainers(environmentId!, params),
    {
      ...withError('Unable to retrieve containers'),
      select,
      enabled: enabled && !!environmentId,
    }
  );
}

export async function getContainers(
  environmentId: EnvironmentId,
  { all = true, filters, nodeName }: UseContainers = {}
) {
  if (!environmentId) {
    return [];
  }

  const data = await dockerClient.listContainers(environmentId, {
    all,
    filters,
    nodeName,
  });
  return data.map(toListViewModel);
}
