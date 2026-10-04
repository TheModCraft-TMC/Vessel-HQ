import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { EdgeStack } from '@/domains/edge/models/edge-stack';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';

export function logsStatusQueryKey(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  return [...queryKeys.item(edgeStackId), 'logs', environmentId] as const;
}

export function useLogsStatus(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  return useQuery(
    logsStatusQueryKey(edgeStackId, environmentId),
    () => getLogsStatus(edgeStackId, environmentId),
    {}
  );
}

interface LogsStatusResponse {
  status: 'collected' | 'idle' | 'pending';
}

async function getLogsStatus(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  try {
    const { data } = await axios.get<LogsStatusResponse>(
      `/edge_stacks/${edgeStackId}/logs/${environmentId}`
    );
    return data.status;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve logs status');
  }
}
