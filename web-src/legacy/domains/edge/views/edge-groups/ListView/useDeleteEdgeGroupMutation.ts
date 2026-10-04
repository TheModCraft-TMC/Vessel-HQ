import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { buildUrl } from '@/domains/edge/queries/edge-groups/build-url';
import { queryKeys } from '@/domains/edge/queries/edge-groups/query-keys';

export function useDeleteEdgeGroupsMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (edgeGroupIds: Array<EdgeGroup['Id']>) =>
      promiseSequence(
        edgeGroupIds.map((edgeGroupId) => () => deleteEdgeGroup(edgeGroupId))
      ),
    mutationOptions(
      withError('Unable to delete Edge Group(s)'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteEdgeGroup(id: EdgeGroup['Id']) {
  try {
    await axios.delete(buildUrl({ id }));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete edge Group');
  }
}
