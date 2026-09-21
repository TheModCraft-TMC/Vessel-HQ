import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { RoleBinding } from '../types';

import { queryKeys } from './query-keys';

export function useRoleBindings(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllRoleBindings(environmentId),
    {
      ...withError('Unable to get role bindings'),
      enabled: options?.enabled,
    }
  );
}

async function getAllRoleBindings(environmentId: EnvironmentId) {
  try {
    const { data: roleBinding } = await axios.get<RoleBinding[]>(
      `kubernetes/${environmentId}/role_bindings`
    );

    return roleBinding;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get role bindings');
  }
}
