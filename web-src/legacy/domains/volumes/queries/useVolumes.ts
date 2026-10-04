import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';

import { toVolume } from '../mappers/volume';
import { VolumeModel } from '../models/volume';
import { getVolumes } from '../services/volume.service';

import { queryKeys } from './query-keys';

export function useVolumes<T = VolumeModel[]>(
  environmentId: EnvironmentId,
  { select }: { select?: (data: VolumeModel[]) => T } = {}
) {
  return useQuery(
    queryKeys.base(environmentId),
    () => getVolumes(environmentId).then((items) => items.map(toVolume)),
    { select }
  );
}

export async function getVolumeList(
  environmentId: EnvironmentId,
  filters?: Parameters<typeof getVolumes>[1]
) {
  const volumes = await getVolumes(environmentId, filters);
  return volumes.map(toVolume);
}
