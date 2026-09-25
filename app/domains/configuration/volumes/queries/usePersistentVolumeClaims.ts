import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { queryKeys } from '@/domains/configuration/volumes/queries/query-keys';
import { withError } from '@/core/query';
import { PersistentVolumeClaim } from '@/domains/configuration/volumes/ListView/types';
import axios from '@/react/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/domains/clusters';

export function usePersistentVolumeClaims<T = PersistentVolumeClaim>(
  environmentId: EnvironmentId,
  queryOptions?: {
    select?: (claims: PersistentVolumeClaim[]) => T[];
  }
) {
  return useQuery(
    queryKeys.claims(environmentId),
    () => getPersistentVolumeClaims(environmentId),
    {
      select: queryOptions?.select,
      ...withError('Unable to retrieve persistent volume claims'),
    }
  );
}

async function getPersistentVolumeClaims(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<PersistentVolumeClaim[]>(
      `/kubernetes/${environmentId}/persistent_volume_claims`
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve persistent volume claims'
    );
  }
}
