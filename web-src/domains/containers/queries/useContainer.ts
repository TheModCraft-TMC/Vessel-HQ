import { useQuery } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { queryClient, withError } from '@/core/query';
import { toContainerDetails } from '@/domains/containers/mappers';
import type { ContainerDetails } from '@/domains/containers/models';
import { queryKeys } from '@/domains/containers/queries/query-keys';
import type { EnvironmentId } from '@/domains/environments';

import type { ContainerId } from '../types';

/** @deprecated Use ContainerDetails from the domain models. */
export type ContainerDetailsJSON = ContainerDetails;
export type ContainerDetailsResponse = ContainerDetails;

export function useContainer<T = ContainerDetailsResponse>(
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
    enabled: enabled !== false && !!containerId,
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
