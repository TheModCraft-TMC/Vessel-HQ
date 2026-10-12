import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { workflowQueryKeys } from '@/domains/gitops/queries/query-keys';
import axios from '@/shared/http';

export interface WorkflowSummary {
  healthy: number;
  error: number;
  syncing: number;
  paused: number;
  unknown: number;
}

async function getWorkflowsSummary(): Promise<WorkflowSummary> {
  const { data } = await axios.get<WorkflowSummary>(
    '/gitops/workflows/summary'
  );
  return data;
}

export function useWorkflowsSummary() {
  return useQuery({
    queryKey: workflowQueryKeys.summary(),
    queryFn: getWorkflowsSummary,
    ...withError('Failed loading workflow summary'),
  });
}
