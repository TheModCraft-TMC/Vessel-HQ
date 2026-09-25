import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { withInvalidate } from '@/core/query';

import { queryKeys } from './queryKeys';
import { deleteNetwork } from './useDeleteNetworkMutation';

export function useDeleteNetworkListMutation() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      networks,
    }: {
      networks: Array<{ nodeName?: string; id: string; name: string }>;
    }) =>
      processItemsInBatches(networks, async ({ id, name, nodeName }) => {
        try {
          await deleteNetwork(environmentId, id, { nodeName });
          notifySuccess('Network successfully removed', name);
        } catch (err) {
          notifyError(`Unable to remove network ${name}`, err);
        }
      }),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
  });
}
