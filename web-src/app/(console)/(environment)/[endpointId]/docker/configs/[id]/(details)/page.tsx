'use client';

import { useCallback, useMemo } from 'react';
import { Clipboard, Code, Copy } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { withError } from '@/core/query';
import { ConfigViewModel } from '@/domains/services/configs/model';
import { queryKeys } from '@/domains/services/configs/queries/query-keys';
import { deleteConfig } from '@/domains/services/configs/queries/useDeleteConfigMutation';
import { getConfig } from '@/domains/services/configs/queries/useConfig';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { Button } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { CodeEditor } from '@@/CodeEditor';

import { DockerObjectDetails } from '../../../_components/DockerObjectDetails';

export default function Page() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useRouteParams();
  const queryKey = useMemo(
    () => [...queryKeys.base(environmentId), params.id] as const,
    [environmentId, params.id]
  );
  const configQuery = useQuery(
    queryKey,
    async () => new ConfigViewModel(await getConfig(environmentId, params.id)),
    withError('Unable to retrieve config')
  );
  const removeConfig = useMutation(
    () => deleteConfig({ environmentId, configId: params.id }),
    withError('Unable to remove config')
  );
  const handleAccessUpdate = useCallback(
    () => queryClient.invalidateQueries(queryKey),
    [queryClient, queryKey]
  );
  const config = configQuery.data;

  if (!config) return null;

  return (
    <>
      <PageHeader
        title="Config details"
        breadcrumbs={[
          { label: 'Configs', link: '/:endpointId/docker/configs' },
          params.id,
        ]}
        reload
      />
      <>
        <DockerObjectDetails
          icon={Clipboard}
          title="Config details"
          name={config.Name}
          id={config.Id}
          createdAt={config.CreatedAt}
          updatedAt={config.UpdatedAt}
          labels={config.Labels}
          dataCy="configDetails-detailsTable"
          actions={
            <div className="ml-2 inline-flex gap-2">
              <Authorized authorizations="DockerConfigDelete">
                <DeleteButton
                  data-cy="configDetails-deleteConfig"
                  size="xsmall"
                  onConfirmed={() =>
                    removeConfig.mutate(undefined, {
                      onSuccess: () => {
                        notifySuccess(
                          'Success',
                          'Configuration successfully removed'
                        );
                        router.push(`/${environmentId}/docker/configs`);
                      },
                    })
                  }
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
                      `/${environmentId}/docker/configs/new?id=${encodeURIComponent(config.Id)}`
                    )
                  }
                >
                  Clone config
                </Button>
              </Authorized>
            </div>
          }
        />
        <AccessControlPanel
          resourceId={config.Id}
          resourceControl={config.ResourceControl}
          resourceType={ResourceControlType.Config}
          environmentId={environmentId}
          onUpdateSuccess={handleAccessUpdate}
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
    </>
  );
}
