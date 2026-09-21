import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';
import { withError, withInvalidate } from '@/core/query/query-client';

import { queryKeys } from './queryKeys';

export function useToggleSystemNamespaceMutation(
  environmentId: EnvironmentId,
  namespaceName: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isSystem: boolean) =>
      toggleSystemNamespace(environmentId, namespaceName, isSystem),
    ...withInvalidate(queryClient, [
      queryKeys.namespace(environmentId, namespaceName),
    ]),
    ...withError('Failed to update namespace'),
  });
}

async function toggleSystemNamespace(
  environmentId: EnvironmentId,
  namespaceName: string,
  system: boolean
) {
  const response = await axios.put(
    `/kubernetes/${environmentId}/namespaces/${namespaceName}/system`,
    { system }
  );
  return response.data;
}
