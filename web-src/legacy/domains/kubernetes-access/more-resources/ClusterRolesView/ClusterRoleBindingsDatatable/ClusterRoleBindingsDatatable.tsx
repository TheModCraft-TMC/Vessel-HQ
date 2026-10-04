import { Trash2, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Row } from '@tanstack/react-table';
import clsx from 'clsx';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import {
  createKubeDatatableStore as createStore,
  CreateFromManifestButton,
  DefaultDatatableSettings,
  SystemResourceDescription,
} from '@/domains/clusters';
import { confirmDelete } from '@/ui/components/dialog/confirm';
import {
  Datatable,
  Table,
  TableSettingsMenu,
} from '@/ui/components/data-table';
import { LoadingButton } from '@/ui/components/buttons';
import { useTableState } from '@/ui/components/data-table/useTableState';

import { ClusterRoleBinding } from './types';
import { columns } from './columns';
import { useClusterRoleBindings } from './queries/useClusterRoleBindings';
import { useDeleteClusterRoleBindingsMutation } from './queries/useDeleteClusterRoleBindingsMutation';

const storageKey = 'clusterRoleBindings';
const settingsStore = createStore(storageKey);

export function ClusterRoleBindingsDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, storageKey);
  const clusterRoleBindingsQuery = useClusterRoleBindings(environmentId, {
    autoRefreshRate: tableState.autoRefreshRateMS,
  });

  const filteredClusterRoleBindings = useMemo(
    () =>
      clusterRoleBindingsQuery.data?.filter(
        (crb) => tableState.showSystemResources || !crb.isSystem
      ),
    [clusterRoleBindingsQuery.data, tableState.showSystemResources]
  );

  const { authorized: isAuthorizedToAddOrEdit } = useAuthorizations([
    'K8sClusterRoleBindingsW',
  ]);

  return (
    <Datatable
      dataset={filteredClusterRoleBindings || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={clusterRoleBindingsQuery.isLoading}
      emptyContentLabel="No supported cluster role bindings found"
      title="Cluster Role Bindings"
      titleIcon={LinkIcon}
      getRowId={(row) => row.uid}
      isRowSelectable={(row) => !row.original.isSystem}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
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
      disableSelect={!isAuthorizedToAddOrEdit}
      renderRow={renderRow}
      data-cy="k8s-cluster-role-bindings-datatable"
    />
  );
}

// needed to apply custom styling to the row and not globally required in the AC's for this ticket.
function renderRow(row: Row<ClusterRoleBinding>, highlightedItemId?: string) {
  return (
    <Table.Row<ClusterRoleBinding>
      cells={row.getVisibleCells()}
      className={clsx('[&>td]:!py-4 [&>td]:!align-top', {
        active: highlightedItemId === row.id,
      })}
    />
  );
}

interface SelectedRole {
  name: string;
}

type TableActionsProps = {
  selectedItems: ClusterRoleBinding[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteClusterRoleBindingsMutation =
    useDeleteClusterRoleBindingsMutation(environmentId);
  const router = useRouter();

  async function handleRemoveClick(roles: SelectedRole[]) {
    const confirmed = await confirmDelete(
      <>
        <p>
          Are you sure you want to delete the selected cluster role binding(s)?
        </p>
        <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
          {roles.map((s, index) => (
            <li key={index}>{s.name}</li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: string[] = [];
    roles.forEach((r) => {
      payload.push(r.name);
    });

    deleteClusterRoleBindingsMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Roles successfully removed',
            roles.map((r) => `${r.name}`).join(', ')
          );
          router.refresh();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete cluster role bindings',
            error as Error,
            roles.map((r) => `${r.name}`).join(', ')
          );
        },
      }
    );
    return roles;
  }

  return (
    <Authorized authorizations="K8sClusterRoleBindingsW">
      <LoadingButton
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemoveClick(selectedItems)}
        icon={Trash2}
        isLoading={deleteClusterRoleBindingsMutation.isLoading}
        loadingText="Removing cluster role bindings..."
        data-cy="k8s-cluster-role-bindings-remove-button"
      >
        Remove
      </LoadingButton>

      <CreateFromManifestButton
        params={{ tab: 'clusterRoleBindings' }}
        data-cy="k8s-cluster-role-bindings-deploy-button"
      />
    </Authorized>
  );
}
