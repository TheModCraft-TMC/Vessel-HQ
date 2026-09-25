import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RegistryId } from '@/domains/registries';
import { Webhook } from '@/react/portainer/webhooks/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/core/query';

import { queryKeys } from './query-keys';

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
    ...withError('Failed to update webhook'),
  });
}

async function updateWebhook({
  webhookId,
  registryId = 0,
}: {
  webhookId: Webhook['Id'];
  registryId?: RegistryId;
}) {
  try {
    const { data } = await axios.put<Webhook>(`/webhooks/${webhookId}`, {
      registryId,
    });
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Failed to update webhook');
  }
}
