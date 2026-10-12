'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { ServiceViewModel } from '@/domains/services/models/service';
import { getServices } from '@/domains/services/queries/useServices';
import { VolumesDatatable } from '@/domains/volumes/components/VolumesDatatable/VolumesDatatable';
import type { DecoratedVolume } from '@/domains/volumes/models/types';
import { queryKeys } from '@/domains/volumes/queries/query-keys';
import { getVolumeList } from '@/domains/volumes/queries/useVolumes';
import { removeVolume } from '@/domains/volumes/services/remove-volume.service';
import { processItemsInBatches } from '@/shared/processItemsInBatches';
import { useIsSwarmManager } from '@/core/composition/useDockerInfo';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useCurrentUser } from '@/core/session/useUser';
import { useEnvironment } from '@/domains/environments/queries/useEnvironment';
import { isAgentEnvironment } from '@/domains/environments/utils';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const { isPureAdmin } = useCurrentUser();
  const isSwarmManager = useIsSwarmManager(environmentId);
  const environmentQuery = useEnvironment(environmentId);
  const attachedQuery = useQuery(
    [...queryKeys.base(environmentId), 'attached'],
    () => getVolumeList(environmentId, { dangling: ['false'] }),
    withError('Unable to retrieve attached volumes')
  );
  const danglingQuery = useQuery(
    [...queryKeys.base(environmentId), 'dangling'],
    () => getVolumeList(environmentId, { dangling: ['true'] }),
    withError('Unable to retrieve dangling volumes')
  );
  const servicesQuery = useQuery(
    ['docker', environmentId, 'volume-services'],
    () => getServices(environmentId),
    { ...withError('Unable to retrieve services'), enabled: isSwarmManager }
  );
  const removeVolumeMutation = useMutation((volume: DecoratedVolume) =>
    removeVolume(environmentId, volume.Name, {
      nodeName: volume.NodeName || '',
    })
  );
  const isLoading =
    attachedQuery.isLoading ||
    danglingQuery.isLoading ||
    (isSwarmManager && servicesQuery.isLoading);
  const volumes = useMemo(
    () =>
      isLoading
        ? undefined
        : decorateVolumes(
            attachedQuery.data || [],
            danglingQuery.data || [],
            servicesQuery.data || []
          ),
    [attachedQuery.data, danglingQuery.data, isLoading, servicesQuery.data]
  );
  const environment = environmentQuery.data;
  const isBrowseVisible = Boolean(
    environment &&
    isAgentEnvironment(environment.Type) &&
    (isPureAdmin ||
      environment.SecuritySettings?.allowVolumeBrowserForRegularUsers)
  );
  const handleRemove = useCallback(
    async (volumesToRemove: DecoratedVolume[]) => {
      await processItemsInBatches(volumesToRemove, async (volume) => {
        try {
          await removeVolumeMutation.mutateAsync(volume);
          notifySuccess('Volume successfully removed', volume.Name);
        } catch (error) {
          notifyError('Failure', error as Error, 'Unable to remove volume');
        }
      });
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
    },
    [environmentId, queryClient, removeVolumeMutation]
  );

  return (
    <>
      <PageHeader title="Volume list" breadcrumbs="Volumes" reload />
      <VolumesDatatable
        dataset={volumes}
        onRemove={handleRemove}
        isBrowseVisible={isBrowseVisible}
      />
    </>
  );
}

function decorateVolumes(
  attached: Awaited<ReturnType<typeof getVolumeList>>,
  dangling: Awaited<ReturnType<typeof getVolumeList>>,
  services: Awaited<ReturnType<typeof getServices>>
): DecoratedVolume[] {
  const serviceModels = services.map(
    (service) => new ServiceViewModel(service)
  );

  return [
    ...attached.map((volume) => ({ ...volume, dangling: false })),
    ...dangling.map((volume) => ({
      ...volume,
      dangling: !serviceModels.some((service) =>
        service.Mounts?.some((mount) => mount.Source === volume.Name)
      ),
    })),
  ];
}
