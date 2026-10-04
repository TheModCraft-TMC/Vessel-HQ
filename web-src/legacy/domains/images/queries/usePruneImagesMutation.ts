import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withInvalidate } from '@/core/query';
import { dockerClient } from '@/core/composition/dockerClient';

import { queryKeys } from './queryKeys';

interface PruneOptions {
  all?: boolean;
  clearBuildCache?: boolean;
}

export function usePruneImagesMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: PruneOptions) => pruneAll(environmentId, options),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
  });
}

export interface PruneResult {
  SpaceReclaimed: number;
  buildCacheError?: unknown;
}

async function pruneAll(
  environmentId: EnvironmentId,
  { all = false, clearBuildCache = false }: PruneOptions
): Promise<PruneResult> {
  const imageData = await pruneImages(environmentId, { all });
  let spaceReclaimed = imageData.SpaceReclaimed;

  if (!clearBuildCache) {
    return { SpaceReclaimed: spaceReclaimed };
  }

  try {
    const cacheData = await pruneBuildCache(environmentId);
    spaceReclaimed += cacheData.SpaceReclaimed;
    return { SpaceReclaimed: spaceReclaimed };
  } catch (buildCacheError) {
    return { SpaceReclaimed: spaceReclaimed, buildCacheError };
  }
}

interface PruneImagesResponse {
  ImagesDeleted: Array<{ Deleted?: string; Untagged?: string }> | null;
  SpaceReclaimed: number;
}

async function pruneImages(
  environmentId: EnvironmentId,
  { all = false }: { all?: boolean }
): Promise<PruneImagesResponse> {
  return dockerClient.pruneImages(environmentId, { all });
}

interface PruneBuildCacheResponse {
  CachesDeleted: string[] | null;
  SpaceReclaimed: number;
}

async function pruneBuildCache(
  environmentId: EnvironmentId
): Promise<PruneBuildCacheResponse> {
  return dockerClient.pruneBuildCache(environmentId);
}
