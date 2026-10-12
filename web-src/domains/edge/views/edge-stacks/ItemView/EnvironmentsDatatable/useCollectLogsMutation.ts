import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { withError } from '@/core/query';
import { EdgeStack } from '@/domains/edge/models/edge-stack';

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
