import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/features/environments';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/core/query/query-client';

import { EdgeStack } from '../../types';

import { logsStatusQueryKey } from './useLogsStatus';

export function useCollectLogsMutation() {
  const queryClient = useQueryClient();

  return useMutation(collectLogs, {
    onSuccess(data, variables) {
      return queryClient.invalidateQueries(
        logsStatusQueryKey(variables.edgeStackId, variables.environmentId)
      );
    },
    ...withError('Unable to retrieve logs'),
  });
}

interface CollectLogs {
  edgeStackId: EdgeStack['Id'];
  environmentId: EnvironmentId;
}

async function collectLogs({ edgeStackId, environmentId }: CollectLogs) {
  try {
    await axios.put(`/edge_stacks/${edgeStackId}/logs/${environmentId}`);
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to start logs collection');
  }
}
