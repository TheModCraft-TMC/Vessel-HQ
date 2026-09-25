import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { EdgeStack } from '@/domains/edge/models/edge-stack';
import { buildUrl } from '@/domains/edge/queries/edge-stacks/buildUrl';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';

export function useDeleteEdgeStacksMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (edgeStackIds: Array<EdgeStack['Id']>) =>
      promiseSequence(
        edgeStackIds.map((edgeStackId) => () => deleteEdgeStack(edgeStackId))
      ),
    mutationOptions(
      withError('Unable to delete Edge stack(s)'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteEdgeStack(id: EdgeStack['Id']) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete edge stack');
  }
}
