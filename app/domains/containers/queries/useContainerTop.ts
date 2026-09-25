import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { ContainerId } from '../types';
import type { ContainerProcesses } from '../models';
import { toContainerProcesses } from '../mappers';

import { queryKeys } from './query-keys';

export function useContainerTop<T = ContainerProcesses>(
  environmentId: EnvironmentId,
  id: ContainerId,
  select?: (environment: ContainerProcesses) => T
) {
  // many containers don't allow this call, so fail early, and omit withError to silently fail
  return useQuery({
    queryKey: queryKeys.top(environmentId, id),
    queryFn: () => getContainerTop(environmentId, id),
    retry: false,
    select,
  });
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getContainerTop(
  environmentId: EnvironmentId,
  id: ContainerId
) {
  const data = await dockerClient.getContainerTop(environmentId, id);
  return toContainerProcesses(data);
}
