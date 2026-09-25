import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { containerQueryKeys } from '@/domains/containers';

export function useConnectContainerMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    (params: Omit<ConnectContainer, 'environmentId'>) =>
      connectContainer({ ...params, environmentId }),
    mutationOptions(
      withError('Failed connecting container to network'),
      withInvalidate(queryClient, [containerQueryKeys.list(environmentId)])
    )
  );
}

interface ConnectContainer {
  environmentId: EnvironmentId;
  networkId: string;
  containerId: string;
  aliases?: string[];
  nodeName?: string;
}

/**
 */
export async function connectContainer({
  environmentId,
  containerId,
  networkId,
  aliases,
  nodeName,
}: ConnectContainer) {
  await dockerClient.connectContainerToNetwork(environmentId, {
    networkId,
    containerId,
    aliases,
    nodeName,
  });
}
