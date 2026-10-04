import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import axios from '@/portainer/services/axios/axios';
import { withError } from '@/core/query';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { StorageClass } from '@/domains/configuration/volumes/ListView/types';

import { queryKeys } from './query-keys';

export function useDeleteStorageClasses(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storageClasses: StorageClass[]) =>
      deleteStorageClasses(storageClasses, environmentId),
    onSuccess: () => {
      notifySuccess('Success', 'Storage classes successfully removed');
      queryClient.invalidateQueries(queryKeys.storages(environmentId));
      return queryClient.invalidateQueries(queryKeys.volumes(environmentId));
    },
    ...withError('Unable to remove storage classes'),
  });
}

function deleteStorageClasses(
  storageClasses: StorageClass[],
  environmentId: EnvironmentId
) {
  return axios.post(
    `/kubernetes/${environmentId}/storage_classes/delete`,
    storageClasses.map((s) => s.name)
  );
}
