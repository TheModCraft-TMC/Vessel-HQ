import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';
import type { DockerImageListDto } from '@/providers/infrastructure/docker';

import { queryKeys } from './queryKeys';

export type ImagesListResponse = DockerImageListDto;

/**
 * Used in ImagesDatatable
 *
 * Query /api/docker/{envId}/images
 */
export function useImages<T = Array<ImagesListResponse>>(
  environmentId: EnvironmentId,
  withUsage = false,
  {
    select,
    enabled,
  }: {
    select?(data: Array<ImagesListResponse>): T;
    enabled?: boolean;
  } = {}
) {
  return useQuery(
    queryKeys.list(environmentId, { withUsage }),
    () => getImages(environmentId, { withUsage }),
    { select, enabled }
  );
}

async function getImages(
  environmentId: EnvironmentId,
  { withUsage }: { withUsage?: boolean } = {}
) {
  return dockerClient.listImages(environmentId, { withUsage });
}
