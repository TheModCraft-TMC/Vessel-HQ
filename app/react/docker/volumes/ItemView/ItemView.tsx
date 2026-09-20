import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { Box, Database, Search, Settings } from 'lucide-react';

import { VolumeViewModel } from '@/docker/models/volume';
import { isoDate } from '@/portainer/filters/filters';
import { notifySuccess } from '@/portainer/services/notifications';
import { useContainers } from '@/react/docker/containers/queries/useContainers';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useCurrentUser } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/react-tools/react-query';

import { Button } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { DetailsTable } from '@@/DetailsTable';
import { Link } from '@@/Link';
import { PageHeader } from '@@/PageHeader';
import { TableContainer, TableTitle } from '@@/datatables';

import { queryKeys } from '../queries/query-keys';
import { getVolume } from '../queries/useVolume';
import { removeVolume } from '../queries/useRemoveVolumeMutation';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPureAdmin } = useCurrentUser();
  const {
    params: { id: volumeId, nodeName },
  } = useCurrentStateAndParams();
  const itemQueryKey = [
    ...queryKeys.base(environmentId),
    volumeId,
    nodeName,
  ] as const;
  const volumeQuery = useQuery(
    itemQueryKey,
    async () =>
      new VolumeViewModel(
        await getVolume(environmentId, volumeId, { nodeName })
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
      <PageHeader
        title="Volume details"
        breadcrumbs={[{ label: 'Volumes', link: 'docker.volumes' }, volume.Id]}
        reload
      />

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
                      to: 'docker.volumes.volume.browse',
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
                      to="docker.containers.container"
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
        router.stateService.go('docker.volumes');
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
