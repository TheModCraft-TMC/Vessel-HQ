import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gitOpsSourcesUpdateGit } from '@api/sdk.gen';

import { withError } from '@/core/query';
import { SourcesSourceUpdatePayload } from '@/core/generated-api/portainer/types.gen';

import { Source } from '../types';

import { sourceQueryKeys } from './query-keys';

export type UpdateSourcePayload = SourcesSourceUpdatePayload & {
  type?: 'git' | 'vault';
};

async function updateSource(
  id: Source['id'],
  payload: UpdateSourcePayload
): Promise<void> {
  const { type, ...body } = payload;
  await gitOpsSourcesUpdateGit({ path: { id }, body });
}

export function useUpdateSourceMutation(id: Source['id']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSourcePayload) => updateSource(id, payload),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: sourceQueryKeys.detail(id),
      });
    },
    ...withError('Unable to update source'),
  });
}
