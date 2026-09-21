import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys } from '@/react/kubernetes/volumes/queries/query-keys';
import { withError } from '@/core/query/query-client';
import { StorageClass } from '@/react/kubernetes/volumes/ListView/types';
import axios from '@/react/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

export function useStorageClasses<T = StorageClass>(
  environmentId: EnvironmentId,
  queryOptions?: {
    select?: (storageClasses: StorageClass[]) => T[];
  }
) {
  return useQuery(
    queryKeys.storages(environmentId),
    () => getStorageClasses(environmentId),
    {
      select: queryOptions?.select,
      ...withError('Unable to retrieve storage classes'),
    }
  );
}

async function getStorageClasses(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<StorageClass[]>(
      `/kubernetes/${environmentId}/storage_classes`
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve storage classes');
  }
}
