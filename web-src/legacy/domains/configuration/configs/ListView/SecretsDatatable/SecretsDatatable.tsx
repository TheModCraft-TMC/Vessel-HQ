import { useMemo } from 'react';
import { Lock } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import {
  DefaultDatatableSettings,
  createKubeDatatableStore,
  SystemResourceDescription,
  CreateFromManifestButton,
} from '@/domains/clusters';
import { useIsDeploymentOptionHidden } from '@/react/hooks/useIsDeploymentOptionHidden';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery, isSystemNamespace } from '@/domains/namespaces';
import type { PortainerNamespace } from '@/domains/namespaces';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import { AddButton } from '@/ui/components/buttons';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

import { useSecretsForCluster } from '../../queries/useSecretsForCluster';
import { useDeleteSecrets } from '../../queries/useDeleteSecrets';
import { IndexOptional, Configuration } from '../../types';

import { SecretRowData } from './types';
import { columns } from './columns';

const storageKey = 'k8sSecretsDatatable';
const settingsStore = createKubeDatatableStore(storageKey);

export function SecretsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const { authorized: canWrite } = useAuthorizations(['K8sSecretsW']);
  const readOnly = !canWrite;
  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );
  const isAddSecretHidden = useIsDeploymentOptionHidden('form');

  const environmentId = useEnvironmentId();
  const namespacesQuery = useNamespacesQuery(environmentId, {
    autoRefreshRate: tableState.autoRefreshRateMS,
  });
  const secretsQuery = useSecretsForCluster(environmentId, {
    autoRefreshRate: tableState.autoRefreshRateMS,
    select: (secrets) =>
      secrets.filter(
        (secret) =>
          (canAccessSystemResources && tableState.showSystemResources) ||
          !isSystemNamespace(secret.Namespace, namespacesQuery.data)
      ),
    isUsed: true,
  });

  const secretRowData = useSecretRowData(
    secretsQuery.data ?? [],
    namespacesQuery.data
  );

  return (
    <Datatable<IndexOptional<SecretRowData>>
      dataset={secretRowData || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={secretsQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No secrets found"
      title="Secrets"
      titleIcon={Lock}
      getRowId={(row) => row.UID ?? ''}
      isRowSelectable={({ original: secret }) =>
        !isSystemNamespace(secret.Namespace, namespacesQuery.data)
      }
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions
          selectedItems={selectedRows}
          isAddSecretHidden={isAddSecretHidden}
        />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
      data-cy="k8s-secrets-datatable"
    />
  );
}

// useSecretRowData appends derived display properties to the secret data
function useSecretRowData(
  secrets: Configuration[],
  namespaces?: PortainerNamespace[]
): SecretRowData[] {
  return useMemo(
    () =>
      secrets?.map((secret) => {
        const registryIdStr = secret.Annotations?.['portainer.io/registry.id'];
        const registryId = registryIdStr
          ? parseInt(registryIdStr, 10) || undefined
          : undefined;
        return {
          ...secret,
          inUse: secret.IsUsed,
          isSystem: namespaces
            ? (namespaces.find(
                (namespace) => namespace.Name === secret.Namespace
              )?.IsSystem ?? false)
            : false,
          registryId,
        };
      }) || [],
    [secrets, namespaces]
  );
}

function TableActions({
  selectedItems,
  isAddSecretHidden,
}: {
  selectedItems: SecretRowData[];
  isAddSecretHidden: boolean;
}) {
  const environmentId = useEnvironmentId();
  const deleteSecretMutation = useDeleteSecrets(environmentId);

  async function handleRemoveClick(secrets: SecretRowData[]) {
    const secretsToDelete = secrets.map((secret) => ({
      namespace: secret.Namespace ?? '',
      name: secret.Name ?? '',
    }));

    await deleteSecretMutation.mutateAsync(secretsToDelete);
  }

  return (
    <Authorized authorizations="K8sSecretsW">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemoveClick(selectedItems)}
        data-cy="k8sSecret-removeSecretButton"
        confirmMessage={`Are you sure you want to remove the selected ${pluralize(
          selectedItems.length,
          'secret'
        )}?`}
      />

      {!isAddSecretHidden && (
        <AddButton
          to="/:endpointId/kubernetes/secrets/new"
          data-cy="k8sSecret-addSecretWithFormButton"
          color="secondary"
        >
          Add with form
        </AddButton>
      )}

      <CreateFromManifestButton
        params={{
          tab: 'secrets',
        }}
        data-cy="k8sSecret-deployFromManifestButton"
      />
    </Authorized>
  );
}
