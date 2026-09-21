import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { Role } from '../types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'roles'] as const,
};

export function useRoles(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllRoles(environmentId),
    {
      ...withError('Unable to get roles'),
      enabled: options?.enabled,
    }
  );
}

async function getAllRoles(environmentId: EnvironmentId) {
  try {
    const { data: roles } = await axios.get<Role[]>(
      `kubernetes/${environmentId}/roles`
    );

    return roles;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get roles');
  }
}
