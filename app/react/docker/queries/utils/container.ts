import { ContainerListViewModel } from '@/domains/containers/types';
import { EdgeStack } from '@/domains/edge/models/edge-stack';
import { EnvironmentId } from '@/domains/environments';

import { buildDockerSnapshotUrl, queryKeys as rootQueryKeys } from './root';

export interface ContainersQueryParams {
  edgeStackId?: EdgeStack['Id'];
}

export const queryKeys = {
  ...rootQueryKeys,
  containers: (environmentId: EnvironmentId) =>
    [...queryKeys.snapshot(environmentId), 'containers'] as const,
  containersQuery: (
    environmentId: EnvironmentId,
    params: ContainersQueryParams
  ) => [...queryKeys.containers(environmentId), params] as const,
  container: (
    environmentId: EnvironmentId,
    containerId: ContainerListViewModel['Id']
  ) => [...queryKeys.containers(environmentId), containerId] as const,
};

export function buildDockerSnapshotContainersUrl(
  environmentId: EnvironmentId,
  containerId?: ContainerListViewModel['Id']
) {
  let url = `${buildDockerSnapshotUrl(environmentId)}/containers`;

  if (containerId) {
    url += `/${containerId}`;
  }

  return url;
}
