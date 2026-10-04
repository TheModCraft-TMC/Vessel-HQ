import { useRouteParams } from '@console/console/routing/useRouteParams';
import { UserX } from 'lucide-react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useUsers } from '@/domains/users';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useTeams } from '@/domains/teams';
import {
  PortainerNamespaceAccessesConfigMap,
  useConfigMap,
  useUpdateK8sConfigMapMutation,
} from '@/domains/configuration';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { Datatable } from '@/ui/components/data-table';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

import { parseNamespaceAccesses } from '../parseNamespaceAccesses';
import { NamespaceAccess } from '../types';
import { createUnauthorizeAccessConfigMapPayload } from '../createAccessConfigMapPayload';

import { entityType } from './columns/type';
import { name } from './columns/name';

const tableKey = 'kubernetes_resourcepool_access';
const columns = [name, entityType];
const store = createPersistedStore(tableKey);

export function AccessDatatable() {
  const { id: namespaceName } = useRouteParams();
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const tableState = useTableState(store, tableKey);
  const usersQuery = useUsers(false, environmentId);
  const teamsQuery = useTeams(false, environmentId);
  const accessConfigMapQuery = useConfigMap(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace,
    PortainerNamespaceAccessesConfigMap.configMapName
  );
  const namespaceAccesses = useMemo(
    () =>
      parseNamespaceAccesses(
        accessConfigMapQuery.data ?? null,
        namespaceName,
        usersQuery.data ?? [],
        teamsQuery.data ?? []
      ),
    [accessConfigMapQuery.data, usersQuery.data, teamsQuery.data, namespaceName]
  );
  const configMap = accessConfigMapQuery.data;

  const updateConfigMapMutation = useUpdateK8sConfigMapMutation(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace
  );

  return (
    <Datatable
      data-cy="access-datatable"
      title="Namespace access"
      titleIcon={UserX}
      dataset={namespaceAccesses}
      isLoading={accessConfigMapQuery.isLoading}
      columns={columns}
      settingsManager={tableState}
      // the user id and team id can be the same, so add the type to the id
      getRowId={(row) => `${row.type}-${row.id}`}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          isLoading={updateConfigMapMutation.isLoading}
          loadingText="Removing..."
          confirmMessage="Are you sure you want to unauthorized the selected users or teams?"
          onConfirmed={() => handleUpdate(selectedItems)}
          disabled={
            selectedItems.length === 0 ||
            usersQuery.isLoading ||
            teamsQuery.isLoading ||
            accessConfigMapQuery.isLoading
          }
          data-cy="remove-access-button"
        />
      )}
    />
  );

  async function handleUpdate(selectedItemsToRemove: Array<NamespaceAccess>) {
    try {
      const configMapPayload = createUnauthorizeAccessConfigMapPayload(
        namespaceAccesses,
        selectedItemsToRemove,
        namespaceName,
        configMap
      );
      await updateConfigMapMutation.mutateAsync({
        configMap: configMapPayload,
        configMapName: PortainerNamespaceAccessesConfigMap.configMapName,
      });
      notifySuccess('Success', 'Namespace access updated');
      router.refresh();
    } catch (error) {
      notifyError('Failed to update namespace access', error as Error);
    }
  }
}
