import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { Box, Database, Search, Settings } from 'lucide-react';

import { VolumeViewModel } from '@/domains/volumes/models/volume';
import { isoDate } from '@/portainer/filters/filters';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { useContainers } from '@/domains/containers';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useCurrentUser } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/core/query';
import { queryKeys } from '@/domains/volumes/queries/query-keys';
import { getVolume } from '@/domains/volumes/services/volume.service';
import { removeVolume } from '@/domains/volumes/services/remove-volume.service';
import { toVolume } from '@/domains/volumes/mappers/volume';
import { Button } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { Link } from '@/ui/components/links/Link';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TableContainer, TableTitle } from '@/ui/components/data-table';

import { DetailsTable } from '@@/DetailsTable';

export function ItemView() {
  return (
    <>
      <PageHeader title="Volume details" breadcrumbs="Volumes" reload />
      <VolumeDetailsContent />
    </>
  );
}

export function VolumeDetailsContent() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isPureAdmin } = useCurrentUser();
  const { id: volumeId, nodeName } = useRouteParams();
  const itemQueryKey = [
    ...queryKeys.base(environmentId),
    volumeId,
    nodeName,
  ] as const;
  const volumeQuery = useQuery(
    itemQueryKey,
    async () =>
      new VolumeViewModel(
        toVolume(await getVolume(environmentId, volumeId, { nodeName }))
      ),
    withError('Unable to retrieve volume details')
  );
  const containersQuery = useContainers(environmentId, {
    filters: { volume: [volumeId] },
    nodeName,
  });
  const environmentQuery = useEnvironment(environmentId);
  const removeMutation = useMutation(
    () => removeVolume(environmentId, volumeId, { nodeName: nodeName || '' }),
    withError('Unable to remove volume')
  );

  if (!volumeQuery.data) {
    return null;
  }

  const volume = volumeQuery.data;
  const environment = environmentQuery.data;
  const isBrowseVisible = Boolean(
    environment &&
    isAgentEnvironment(environment.Type) &&
    (isPureAdmin ||
      environment.SecuritySettings?.allowVolumeBrowserForRegularUsers)
  );
  const containers = (containersQuery.data || []).map((container) => ({
    ...container,
    volumeData: container.Mounts?.find((mount) => mount.Name === volumeId),
  }));

  return (
    <>
      <TableContainer>
        <TableTitle label="Volume details" icon={Database} />
        <DetailsTable dataCy="volumeDetails-detailsTable">
          <DetailsTable.Row label="ID">
            {volume.Id}
            <span className="ml-2 inline-flex gap-2">
              {isBrowseVisible && (
                <Authorized authorizations="DockerAgentBrowseList">
                  <Button
                    color="primary"
                    size="xsmall"
                    icon={Search}
                    as={Link}
                    props={{
                      to: '/:endpointId/docker/volumes/:id/browse',
                      params: { id: volume.Name, nodeName },
                    }}
                    data-cy="volumeDetails-browse"
                  >
                    Browse
                  </Button>
                </Authorized>
              )}
              <Authorized authorizations="DockerVolumeDelete">
                <DeleteButton
                  size="xsmall"
                  onConfirmed={handleRemove}
                  confirmMessage="Do you want to remove this volume?"
                  data-cy="volumeDetails-delete"
                >
                  Remove this volume
                </DeleteButton>
              </Authorized>
            </span>
          </DetailsTable.Row>
          <DetailsTable.Row label="Created">
            {isoDate(volume.CreatedAt)}
          </DetailsTable.Row>
          <DetailsTable.Row label="Mount path">
            {volume.Mountpoint}
          </DetailsTable.Row>
          <DetailsTable.Row label="Driver">{volume.Driver}</DetailsTable.Row>
          {volume.Labels && Object.keys(volume.Labels).length > 0 && (
            <DetailsTable.Row label="Labels">
              <KeyValueTable values={volume.Labels} />
            </DetailsTable.Row>
          )}
        </DetailsTable>
      </TableContainer>

      <AccessControlPanel
        resourceId={volume.ResourceId || volume.Name}
        resourceControl={volume.ResourceControl}
        resourceType={ResourceControlType.Volume}
        environmentId={environmentId}
        onUpdateSuccess={() => queryClient.invalidateQueries(itemQueryKey)}
      />

      {volume.Options && Object.keys(volume.Options).length > 0 && (
        <TableContainer>
          <TableTitle label="Volume options" icon={Settings} />
          <KeyValueTable values={volume.Options} />
        </TableContainer>
      )}

      {containers.length > 0 && (
        <TableContainer>
          <TableTitle label="Containers using volume" icon={Box} />
          <table className="table">
            <thead>
              <tr>
                <th>Container name</th>
                <th>Mounted at</th>
                <th>Read-only</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.Id}>
                  <td>
                    <Link
                      to="/:endpointId/docker/containers/:id"
                      params={{
                        id: container.Id,
                        nodeName: container.NodeName,
                      }}
                      data-cy={`volumeDetails-container-${container.Id}`}
                    >
                      {container.Names?.[0] || container.Id}
                    </Link>
                  </td>
                  <td>{container.volumeData?.Destination || '-'}</td>
                  <td>
                    {container.volumeData
                      ? String(!container.volumeData.RW)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </>
  );

  function handleRemove() {
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('Volume successfully removed', volumeId);
        router.push(buildHref('/:endpointId/docker/volumes', {}, pathname));
      },
    });
  }
}

function KeyValueTable({ values }: { values: Record<string, string> }) {
  return (
    <table className="table-bordered table-condensed table">
      <tbody>
        {Object.entries(values).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
