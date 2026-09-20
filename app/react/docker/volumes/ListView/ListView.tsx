import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ServiceViewModel } from '@/docker/models/service';
import { VolumeViewModel } from '@/docker/models/volume';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useIsSwarmManager } from '@/react/docker/proxy/queries/useInfo';
import { getServices } from '@/react/docker/services/queries/useServices';
import { getVolumes } from '@/react/docker/volumes/queries/useVolumes';
import { removeVolume } from '@/react/docker/volumes/queries/useRemoveVolumeMutation';
import { queryKeys } from '@/react/docker/volumes/queries/query-keys';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/react-tools/react-query';

import { PageHeader } from '@@/PageHeader';

import { DecoratedVolume } from './types';
import { VolumesDatatable } from './VolumesDatatable';

export function ListView() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const { isPureAdmin } = useCurrentUser();
  const isSwarmManager = useIsSwarmManager(environmentId);
  const environmentQuery = useEnvironment(environmentId);
  const attachedQuery = useQuery(
    [...queryKeys.base(environmentId), 'attached'],
    () => getVolumes(environmentId, { dangling: ['false'] }),
    withError('Unable to retrieve attached volumes')
  );
  const danglingQuery = useQuery(
    [...queryKeys.base(environmentId), 'dangling'],
    () => getVolumes(environmentId, { dangling: ['true'] }),
    withError('Unable to retrieve dangling volumes')
  );
  const servicesQuery = useQuery(
    ['docker', environmentId, 'volume-services'],
    () => getServices(environmentId),
    {
      ...withError('Unable to retrieve services'),
      enabled: isSwarmManager,
    }
  );
  const removeMutation = useMutation((volume: DecoratedVolume) =>
    removeVolume(environmentId, volume.Name, {
      nodeName: volume.NodeName || '',
    })
  );

  const isLoading =
    attachedQuery.isLoading ||
    danglingQuery.isLoading ||
    (isSwarmManager && servicesQuery.isLoading);
  const volumes = isLoading
    ? undefined
    : decorateVolumes(
        attachedQuery.data || [],
        danglingQuery.data || [],
        servicesQuery.data || []
      );
  const environment = environmentQuery.data;
  const isBrowseVisible = Boolean(
    environment &&
    isAgentEnvironment(environment.Type) &&
    (isPureAdmin ||
      environment.SecuritySettings?.allowVolumeBrowserForRegularUsers)
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

  async function handleRemove(selectedItems: DecoratedVolume[]) {
    await processItemsInBatches(selectedItems, async (volume) => {
      try {
        await removeMutation.mutateAsync(volume);
        notifySuccess('Volume successfully removed', volume.Name);
      } catch (error) {
        notifyError('Failure', error as Error, 'Unable to remove volume');
      }
    });
    await queryClient.invalidateQueries(queryKeys.base(environmentId));
  }
}

function decorateVolumes(
  attached: Awaited<ReturnType<typeof getVolumes>>,
  dangling: Awaited<ReturnType<typeof getVolumes>>,
  services: Awaited<ReturnType<typeof getServices>>
): DecoratedVolume[] {
  const serviceModels = services.map(
    (service) => new ServiceViewModel(service)
  );

  return [
    ...attached.map((volume) => ({
      ...new VolumeViewModel(volume),
      dangling: false,
    })),
    ...dangling.map((volume) => ({
      ...new VolumeViewModel(volume),
      dangling: !serviceModels.some((service) =>
        service.Mounts?.some((mount) => mount.Source === volume.Name)
      ),
    })),
  ];
}
