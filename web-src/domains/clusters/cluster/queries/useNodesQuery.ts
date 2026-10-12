import { useQuery } from '@tanstack/react-query';
import type { Node } from 'kubernetes-types/core/v1';

import { withError } from '@/core/query';
import { parseKubernetesAxiosError } from '@/domains/clusters/axiosError';
import { queryKeys } from '@/domains/clusters/cluster/queries/query-keys';
import type { EnvironmentId } from '@/domains/environments';
import axios from '@/shared/http';

export async function getNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodes } = await axios.get<Node[]>(
      `/kubernetes/${environmentId}/nodes`
    );
    return nodes;
  } catch (error) {
    throw parseKubernetesAxiosError(error, 'Unable to get nodes');
  }
}

export function useNodesQuery<T = Node[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    enabled?: boolean;
    select?: (nodes: Node[]) => T;
  }
) {
  return useQuery(
    queryKeys.nodes(environmentId),
    async () => getNodes(environmentId),
    {
      ...withError(
        'Failed to get nodes from the Kubernetes api',
        'Failed to get nodes'
      ),
      enabled: options?.enabled,
      select: options?.select,
    }
  );
}
