import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { Clipboard, Code, Copy } from 'lucide-react';

import { isoDate } from '@/portainer/filters/filters';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { Button } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TableContainer, TableTitle } from '@/ui/components/data-table';

import { CodeEditor } from '@@/CodeEditor';
import { DetailsTable } from '@@/DetailsTable';

import { ConfigViewModel } from '../model';
import { queryKeys } from '../queries/query-keys';
import { getConfig } from '../queries/useConfig';
import { deleteConfig } from '../queries/useDeleteConfigMutation';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { id } = useRouteParams();
  const itemQueryKey = [...queryKeys.base(environmentId), id] as const;
  const configQuery = useQuery(
    itemQueryKey,
    async () => new ConfigViewModel(await getConfig(environmentId, id)),
    withError('Unable to retrieve config')
  );
  const removeMutation = useMutation(
    () => deleteConfig({ environmentId, configId: id }),
    withError('Unable to remove config')
  );

  if (!configQuery.data) {
    return null;
  }

  const config = configQuery.data;

  return (
    <>
      <PageHeader
        title="Config details"
        breadcrumbs={[
          { label: 'Configs', link: '/:endpointId/docker/configs' },
          config.Name,
        ]}
        reload
      />
      <TableContainer>
        <TableTitle label="Config details" icon={Clipboard} />
        <DetailsTable dataCy="configDetails-detailsTable">
          <DetailsTable.Row label="Name">{config.Name}</DetailsTable.Row>
          <DetailsTable.Row label="ID">
            {config.Id}
            <span className="ml-2 inline-flex gap-2">
              <Authorized authorizations="DockerConfigDelete">
                <DeleteButton
                  data-cy="configDetails-deleteConfig"
                  size="xsmall"
                  onConfirmed={handleRemove}
                  confirmMessage="Are you sure you want to delete this config?"
                >
                  Delete this config
                </DeleteButton>
              </Authorized>
              <Authorized authorizations="DockerConfigCreate">
                <Button
                  color="secondary"
                  size="xsmall"
                  icon={Copy}
                  data-cy="configDetails-cloneConfig"
                  onClick={() =>
                    router.push(
                      buildHref(
                        '/:endpointId/docker/configs/new',
                        {
                          id: config.Id,
                        },
                        pathname
                      )
                    )
                  }
                >
                  Clone config
                </Button>
              </Authorized>
            </span>
          </DetailsTable.Row>
          <DetailsTable.Row label="Created">
            {isoDate(config.CreatedAt)}
          </DetailsTable.Row>
          <DetailsTable.Row label="Last updated">
            {isoDate(config.UpdatedAt)}
          </DetailsTable.Row>
          {Object.keys(config.Labels).length > 0 && (
            <DetailsTable.Row label="Labels">
              <table className="table-bordered table-condensed table">
                <tbody>
                  {Object.entries(config.Labels).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DetailsTable.Row>
          )}
        </DetailsTable>
      </TableContainer>

      <AccessControlPanel
        resourceId={config.Id}
        resourceControl={config.ResourceControl}
        resourceType={ResourceControlType.Config}
        environmentId={environmentId}
        onUpdateSuccess={() => queryClient.invalidateQueries(itemQueryKey)}
      />

      <TableContainer>
        <TableTitle label="Config content" icon={Code} />
        <div className="p-4">
          <CodeEditor
            id="config-editor"
            value={config.Data}
            readonly
            data-cy="configDetails-editor"
          />
        </div>
      </TableContainer>
    </>
  );

  function handleRemove() {
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('Success', 'Configuration successfully removed');
        router.push(buildHref('/:endpointId/docker/configs', {}, pathname));
      },
    });
  }
}
