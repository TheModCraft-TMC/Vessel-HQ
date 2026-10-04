import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { queryKeys } from '@/domains/configuration/volumes/queries/query-keys';
import { withError } from '@/core/query';
import { PersistentVolume } from '@/domains/configuration/volumes/ListView/types';
import axios from '@/react/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/domains/clusters';

export function usePersistentVolumes<T = PersistentVolume>(
  environmentId: EnvironmentId,
  queryOptions?: {
    select?: (volumes: PersistentVolume[]) => T[];
  }
) {
  return useQuery(
    queryKeys.volumes(environmentId),
    () => getPersistentVolumes(environmentId, { withApplications: true }),
    {
      select: queryOptions?.select,
      ...withError('Unable to retrieve persistent volumes'),
    }
  );
}

async function getPersistentVolumes(
  environmentId: EnvironmentId,
  params?: { withApplications: boolean }
) {
  try {
    const { data } = await axios.get<PersistentVolume[]>(
      `/kubernetes/${environmentId}/persistent_volumes`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve persistent volumes');
  }
}
