import { Task } from '@/providers/infrastructure/docker';
import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';
import { withFiltersQueryParam } from '../utils';

import { queryKeys } from './query-keys';

/**
 * https://docs.docker.com/reference/api/engine/version/v1.52/#tag/Task/operation/TaskList
 */
type Filters = {
  'desired-state'?: Array<'running' | 'shutdown' | 'accepted'>;
  id?: Array<Task['ID']>;
  label?: Array<string>;
  name?: Array<Task['Name']>;
  node?: Array<Task['NodeID']>;
  service?: Array<Task['ServiceID']>;
};

export function useTasks<T = Task>(
  {
    environmentId,
    filters,
  }: {
    environmentId: EnvironmentId;
    filters?: Filters;
  },
  { enabled, select }: { enabled?: boolean; select?: (data: Task[]) => T } = {}
) {
  return useQuery({
    queryKey: queryKeys.list(environmentId, filters),
    queryFn: () => getTasks(environmentId, filters),
    enabled,
    select,
  });
}

export async function getTasks(
  environmentId: EnvironmentId,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<Task[]>(
      buildDockerProxyUrl(environmentId, 'tasks'),
      {
        params: {
          ...withFiltersQueryParam(filters),
        },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve tasks');
  }
}
