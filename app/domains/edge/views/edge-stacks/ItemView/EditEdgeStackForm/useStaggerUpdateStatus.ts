import { useQuery } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { EdgeStack } from '@/domains/edge/models/edge-stack';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';
import { buildUrl } from '@/domains/edge/queries/edge-stacks/buildUrl';

export function staggerStatusQueryKey(edgeStackId: EdgeStack['Id']) {
  return [...queryKeys.item(edgeStackId), 'stagger', 'status'] as const;
}

export function useStaggerUpdateStatus(edgeStackId: EdgeStack['Id']) {
  return useQuery(
    [...queryKeys.item(edgeStackId), 'stagger-status'],
    () => getStaggerStatus(edgeStackId),
    { enabled: isBE }
  );
}

interface StaggerStatusResponse {
  status: 'idle' | 'updating';
}

async function getStaggerStatus(edgeStackId: EdgeStack['Id']) {
  try {
    const { data } = await axios.get<StaggerStatusResponse>(
      buildUrl(edgeStackId, 'stagger/status')
    );
    return data.status;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve stagger status');
  }
}
