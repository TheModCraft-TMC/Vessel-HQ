import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { EdgeJob } from '@/domains/edge/models/edge-job';
import { buildUrl } from '@/domains/edge/queries/edge-jobs/build-url';
import { queryKeys } from '@/domains/edge/queries/edge-jobs/query-keys';

export function useDeleteEdgeJobsMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (edgeJobIds: Array<EdgeJob['Id']>) =>
      promiseSequence(
        edgeJobIds.map((edgeJobId) => () => deleteEdgeJob(edgeJobId))
      ),
    mutationOptions(
      withError('Unable to delete Edge job(s)'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteEdgeJob(id: EdgeJob['Id']) {
  try {
    await axios.delete(buildUrl({ id }));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete edge job');
  }
}
