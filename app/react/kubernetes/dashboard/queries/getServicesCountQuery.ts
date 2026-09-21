import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard', 'servicesCount'] as const,
};

export function useGetServicesCountQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getServicesCount(environmentId),
    {
      ...withError('Unable to get services count'),
    }
  );
}

async function getServicesCount(environmentId: EnvironmentId) {
  try {
    const { data: servicesCount } = await axios.get<number>(
      `kubernetes/${environmentId}/services/count`
    );

    return servicesCount;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
