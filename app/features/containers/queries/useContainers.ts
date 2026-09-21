import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/core/query/query-client';
import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';
import {
  withFiltersQueryParam,
  withAgentTargetHeader,
} from '@/react/docker/proxy/queries/utils';

import { DockerContainerResponse } from '../types/response';
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
  try {
    if (!environmentId) {
      return [];
    }

    const { data } = await axios.get<DockerContainerResponse[]>(
      buildDockerProxyUrl(environmentId, 'containers', 'json'),
      {
        params: { all, ...withFiltersQueryParam(filters) },
        headers: { ...withAgentTargetHeader(nodeName) },
      }
    );
    return data.map((c) => toListViewModel(c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
