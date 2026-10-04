import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ServiceViewModel } from '@/domains/services';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useIsSwarmManager } from '@/react/docker/proxy/queries/useInfo';
import { getServices } from '@/domains/services';
import { getVolumeList } from '@/domains/volumes/queries/useVolumes';
import { removeVolume } from '@/domains/volumes/services/remove-volume.service';
import { queryKeys } from '@/domains/volumes/queries/query-keys';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/core/query';
import { DecoratedVolume } from '@/domains/volumes/models/types';
import { VolumesDatatable } from '@/domains/volumes/components/VolumesDatatable/VolumesDatatable';
import { PageHeader } from '@/ui/layouts/view-layout';

export function ListView() {
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
  attached: Awaited<ReturnType<typeof getVolumeList>>,
  dangling: Awaited<ReturnType<typeof getVolumeList>>,
  services: Awaited<ReturnType<typeof getServices>>
): DecoratedVolume[] {
  const serviceModels = services.map(
    (service) => new ServiceViewModel(service)
  );

  return [
    ...attached.map((volume) => ({
      ...volume,
      dangling: false,
    })),
    ...dangling.map((volume) => ({
      ...volume,
      dangling: !serviceModels.some((service) =>
        service.Mounts?.some((mount) => mount.Source === volume.Name)
      ),
    })),
  ];
}
