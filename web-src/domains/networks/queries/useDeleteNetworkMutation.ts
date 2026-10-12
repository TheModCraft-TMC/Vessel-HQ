import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { NetworkId } from '../models/network';

import { queryKeys } from './queryKeys';

export function useDeleteNetwork(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      networkId,
      nodeName,
    }: {
      networkId: NetworkId;
      nodeName?: string;
    }) => deleteNetwork(environmentId, networkId, { nodeName }),
    ...withError('Unable to remove network'),
    onSuccess(_, { networkId }) {
      queryClient.cancelQueries(queryKeys.item(environmentId, networkId));
      return queryClient.invalidateQueries(queryKeys.base(environmentId));
    },
  });
}

/**
 */
export async function deleteNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  await dockerClient.removeNetwork(environmentId, networkId, { nodeName });
  return networkId;
}
