import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { dockerClient } from '@/core/composition/dockerClient';

import { toListViewModel } from '../utils';
import { ContainerListViewModel } from '../types';

import { Filters } from './types';
import { queryKeys } from './query-keys';

interface UseContainers {
  all?: boolean;
  filters?: Filters;
  nodeName?: string;
}

export function useContainers<T = ContainerListViewModel[]>(
  environmentId: EnvironmentId | undefined,
  {
    autoRefreshRate,
    select,
    enabled,
    ...params
  }: UseContainers & {
    autoRefreshRate?: number;
    select?: (data: ContainerListViewModel[]) => T;
    enabled?: boolean;
  } = {}
) {
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

/**
 * Fetch containers and transform to ContainerListViewModel
 * @param environmentId
 * @param param1
 * @returns ContainerListViewModel[]
 */
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
