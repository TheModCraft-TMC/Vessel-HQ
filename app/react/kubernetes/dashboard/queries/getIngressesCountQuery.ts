import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard', 'ingressesCount'] as const,
};

export function useGetIngressesCountQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getIngressesCount(environmentId),
    {
      ...withError('Unable to get ingresses count'),
    }
  );
}

async function getIngressesCount(environmentId: EnvironmentId) {
  try {
    const { data: ingressesCount } = await axios.get<number>(
      `kubernetes/${environmentId}/ingresses/count`
    );

    return ingressesCount;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
