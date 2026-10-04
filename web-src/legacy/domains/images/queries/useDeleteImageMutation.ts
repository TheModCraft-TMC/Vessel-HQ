import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withInvalidate } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { queryKeys } from './queryKeys';

export function useDeleteImageMutation(envId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImage,
    ...withInvalidate(queryClient, [queryKeys.base(envId)]),
  });
}

export async function deleteImage({
  environmentId,
  imageId,
  nodeName,
  force,
}: {
  environmentId: EnvironmentId;
  imageId: string;
  nodeName?: string;
  force?: boolean;
}) {
  return dockerClient.removeImage(environmentId, imageId, { nodeName, force });
}
