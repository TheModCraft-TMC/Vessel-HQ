import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { ContainerId } from '../types';
import { toContainerDetails } from '../mappers';

import { queryKeys } from './query-keys';

export function useContainerInspect(
  environmentId: EnvironmentId,
  id: ContainerId,
  params: { nodeName?: string } = {}
) {
  return useQuery({
    queryKey: [...queryKeys.container(environmentId, id), params] as const,
    queryFn: () => inspectContainer(environmentId, id, params),
  });
}

export async function inspectContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const data = await dockerClient.inspectContainer(environmentId, id, {
    nodeName,
  });
  return toContainerDetails(data);
}
