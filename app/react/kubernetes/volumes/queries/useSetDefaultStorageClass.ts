import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import axios from '@/portainer/services/axios/axios';
import { withError } from '@/core/query/query-client';
import { notifySuccess } from '@/portainer/services/notifications';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

import { queryKeys } from './query-keys';

export function useSetDefaultStorageClass(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => setDefaultStorageClass(name, environmentId),
    onSuccess: () => {
      notifySuccess('Success', 'Default storage class successfully updated');
      return queryClient.invalidateQueries(queryKeys.storages(environmentId));
    },
    ...withError('Unable to set default storage class'),
  });
}

async function setDefaultStorageClass(
  name: string,
  environmentId: EnvironmentId
) {
  try {
    await axios.put(
      `/kubernetes/${environmentId}/storage_classes/${encodeURIComponent(
        name
      )}/default`
    );
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to set default storage class');
  }
}
