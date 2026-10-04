import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { containerQueryKeys } from '@/domains/containers';
import type { ContainerId } from '@/domains/containers';
import { dockerClient } from '@/core/composition/dockerClient';

import { NetworkId } from '../models/network';

import { queryKeys } from './queryKeys';

export function useDisconnectContainer({
  environmentId,
  networkId,
}: {
  environmentId: EnvironmentId;
  networkId: NetworkId;
}) {
  const client = useQueryClient();

  return useMutation(
    ({
      containerId,
      nodeName,
    }: {
      containerId: ContainerId;
      nodeName?: string;
    }) => disconnectContainer(environmentId, networkId, containerId, nodeName),
    mutationOptions(
      withInvalidate(client, [
        queryKeys.item(environmentId, networkId),
        containerQueryKeys.list(environmentId),
      ]),
      withError('Unable to disconnect container from network')
    )
  );
}

/**
 */
export async function disconnectContainer(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  containerId: ContainerId,
  nodeName?: string
) {
  await dockerClient.disconnectContainerFromNetwork(environmentId, {
    networkId,
    containerId,
    nodeName,
  });
  return { networkId, environmentId };
}
