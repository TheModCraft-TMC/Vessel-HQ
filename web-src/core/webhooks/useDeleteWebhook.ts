import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Webhook } from '@/core/webhooks/types';
import axios, { parseAxiosError } from '@/shared/http';
import { withError } from '@/core/query';

import { queryKeys } from './query-keys';

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId }: { webhookId: Webhook['Id'] }) =>
      deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
    ...withError('Failed to delete webhook'),
  });
}

async function deleteWebhook(webhookId: Webhook['Id']) {
  try {
    await axios.delete(`/webhooks/${webhookId}`);
  } catch (err) {
    throw parseAxiosError(err, 'Failed to delete webhook');
  }
}
