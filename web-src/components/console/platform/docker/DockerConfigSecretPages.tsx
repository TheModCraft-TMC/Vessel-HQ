'use client';

import { ReactNode } from 'react';
import { Clipboard, Code, Copy, Lock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { withError } from '@/core/query';
import { ConfigViewModel } from '@/domains/services/configs/model';
import { queryKeys as configQueryKeys } from '@/domains/services/configs/queries/query-keys';
import { getConfig } from '@/domains/services/configs/queries/useConfig';
import { deleteConfig } from '@/domains/services/configs/queries/useDeleteConfigMutation';
import { SecretViewModel } from '@/domains/services/models/secret';
import {
  getSecret,
  removeSecret,
} from '@/domains/services/secrets/queries/useSecrets';
import { isoDate } from '@/portainer/filters/filters';
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
import { DetailsTable } from '@@/DetailsTable';

export function DockerConfigDetailsHeader() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const configQuery = useQuery(
    [...configQueryKeys.base(environmentId), params.id],
    async () => new ConfigViewModel(await getConfig(environmentId, params.id)),
    withError('Unable to retrieve config')
  );

  return (
    <PageHeader
      title="Config details"
      breadcrumbs={[
        { label: 'Configs', link: '/:endpointId/docker/configs' },
        configQuery.data?.Name || params.id,
      ]}
      reload
    />
  );
}

export function DockerConfigDetailsContent() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useRouteParams();
  const queryKey = [...configQueryKeys.base(environmentId), params.id] as const;
  const configQuery = useQuery(
    queryKey,
    async () => new ConfigViewModel(await getConfig(environmentId, params.id)),
    withError('Unable to retrieve config')
  );
  const removeConfig = useMutation(
    () => deleteConfig({ environmentId, configId: params.id }),
    withError('Unable to remove config')
  );
  const config = configQuery.data;
  if (!config) return null;

  return (
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
        onUpdateSuccess={() => queryClient.invalidateQueries(queryKey)}
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
}

export function DockerSecretDetailsHeader() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const queryKey = ['docker', environmentId, 'secrets', params.id] as const;
  const secretQuery = useQuery(
    queryKey,
    async () => new SecretViewModel(await getSecret(environmentId, params.id)),
    withError('Unable to retrieve secret')
  );

  return (
    <PageHeader
      title="Secret details"
      breadcrumbs={[
        { label: 'Secrets', link: '/:endpointId/docker/secrets' },
        secretQuery.data?.Name || params.id,
      ]}
      reload
    />
  );
}

export function DockerSecretDetailsContent() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useRouteParams();
  const queryKey = ['docker', environmentId, 'secrets', params.id] as const;
  const secretQuery = useQuery(
    queryKey,
    async () => new SecretViewModel(await getSecret(environmentId, params.id)),
    withError('Unable to retrieve secret')
  );
  const removeSecretMutation = useMutation(
    () => removeSecret(environmentId, params.id),
    withError('Unable to remove secret')
  );
  const secret = secretQuery.data;
  if (!secret) return null;

  return (
    <>
      <DockerObjectDetails
        icon={Lock}
        title="Secret details"
        name={secret.Name}
        id={secret.Id}
        createdAt={secret.CreatedAt}
        updatedAt={secret.UpdatedAt}
        labels={secret.Labels}
        dataCy="secretDetails-detailsTable"
        actions={
          <span className="ml-2">
            <Authorized authorizations="DockerSecretDelete">
              <DeleteButton
                data-cy="secretDetails-deleteSecret"
                size="xsmall"
                onConfirmed={() =>
                  removeSecretMutation.mutate(undefined, {
                    onSuccess: () => {
                      notifySuccess('Secret successfully removed', secret.Name);
                      router.push(`/${environmentId}/docker/secrets`);
                    },
                  })
                }
                confirmMessage="Do you want to delete this secret?"
              >
                Delete this secret
              </DeleteButton>
            </Authorized>
          </span>
        }
      />
      <AccessControlPanel
        resourceId={secret.Id}
        resourceControl={secret.ResourceControl}
        resourceType={ResourceControlType.Secret}
        environmentId={environmentId}
        onUpdateSuccess={() => queryClient.invalidateQueries(queryKey)}
      />
    </>
  );
}

function DockerObjectDetails({
  icon,
  title,
  name,
  id,
  createdAt,
  updatedAt,
  labels,
  actions,
  dataCy,
}: {
  icon: typeof Clipboard;
  title: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  labels: Record<string, string>;
  actions: ReactNode;
  dataCy: string;
}) {
  return (
    <TableContainer>
      <TableTitle label={title} icon={icon} />
      <DetailsTable dataCy={dataCy}>
        <DetailsTable.Row label="Name">{name}</DetailsTable.Row>
        <DetailsTable.Row label="ID">
          {id}
          {actions}
        </DetailsTable.Row>
        <DetailsTable.Row label="Created">
          {isoDate(createdAt)}
        </DetailsTable.Row>
        <DetailsTable.Row label="Last updated">
          {isoDate(updatedAt)}
        </DetailsTable.Row>
        {Object.keys(labels).length > 0 && (
          <DetailsTable.Row label="Labels">
            <LabelsTable labels={labels} />
          </DetailsTable.Row>
        )}
      </DetailsTable>
    </TableContainer>
  );
}

function LabelsTable({ labels }: { labels: Record<string, string> }) {
  return (
    <table className="table-bordered table-condensed table">
      <tbody>
        {Object.entries(labels).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
