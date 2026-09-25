import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard', 'namespacesCount'] as const,
};

export function useGetNamespacesCountQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getNamespacesCount(environmentId),
    {
      ...withError('Unable to get namespaces count'),
    }
  );
}

async function getNamespacesCount(environmentId: EnvironmentId) {
  try {
    const { data: namespacesCount } = await axios.get<number>(
      `kubernetes/${environmentId}/namespaces/count`
    );

    return namespacesCount;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
