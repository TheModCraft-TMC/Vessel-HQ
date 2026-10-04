import { useQuery } from '@tanstack/react-query';

import { ContainerId } from '@/domains/containers/types';
import { EnvironmentId } from '@/domains/environments';
import { queryClient, withError } from '@/core/query';
import { dockerClient } from '@/core/composition/dockerClient';

import type { ContainerDetails } from '../models';
import { toContainerDetails } from '../mappers';

import { queryKeys } from './query-keys';

/** @deprecated Use ContainerDetails from the domain models. */
export type ContainerDetailsJSON = ContainerDetails;

export function useContainer<T>(
  {
    environmentId,
    containerId,
    nodeName,
  }: {
    environmentId: EnvironmentId;
    containerId?: ContainerId;
    nodeName?: string;
  },
  {
    enabled,
    select,
  }: { enabled?: boolean; select?(container: ContainerDetailsResponse): T } = {}
) {
  return useQuery({
    queryKey: queryKeys.container(environmentId, containerId!),
    queryFn: () => getContainer(environmentId, containerId!, { nodeName }),
    enabled: enabled && !!containerId,
    select,
    ...withError('Unable to retrieve container'),
  });
}

export function invalidateContainer(
  environmentId: EnvironmentId,
  containerId?: ContainerId
) {
  return queryClient.invalidateQueries(
    containerId ? queryKeys.container(environmentId, containerId) : []
  );
}

export type ContainerDetailsResponse = ContainerDetails;

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @param param2
 * @returns
 */
export async function getContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const data = await dockerClient.inspectContainer(environmentId, id, {
    nodeName,
  });
  return toContainerDetails(data);
}
