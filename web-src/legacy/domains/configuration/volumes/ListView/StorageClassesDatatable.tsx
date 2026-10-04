import { HardDrive } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useStorageClasses } from '@/domains/configuration/volumes/queries/useStorageClasses';
import { useDeleteStorageClasses } from '@/domains/configuration/volumes/queries/useDeleteStorageClasses';
import { useSetDefaultStorageClass } from '@/domains/configuration/volumes/queries/useSetDefaultStorageClass';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  refreshableSettings,
} from '@/ui/components/data-table/types';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { CreateFromManifestButton } from '@/domains/clusters';

import { createStorageClassesColumns } from './storageClassesColumns';
import { StorageClass } from './types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function StorageClassesDatatable() {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes-sc',
    'name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );

  const { authorized: hasWriteAuth } = useAuthorizations(
    'K8sVolumesW',
    undefined,
    false
  );

  const envId = useEnvironmentId();
  const deleteStorageClassesMutation = useDeleteStorageClasses(envId);
  const setDefaultStorageClassMutation = useSetDefaultStorageClass(envId);
  const storageClassesQuery = useStorageClasses(envId, {});
  const storageClasses = storageClassesQuery.data ?? [];

  const columns = createStorageClassesColumns((storageClass: StorageClass) =>
    setDefaultStorageClassMutation.mutate(storageClass.name)
  );

  return (
    <Datatable<StorageClass>
      data-cy="k8s-storageclasses-datatable"
      isLoading={storageClassesQuery.isLoading}
      dataset={storageClasses}
      columns={columns}
      settingsManager={tableState}
      title="Storage"
      titleIcon={HardDrive}
      getRowId={(row) => `${row.name}`}
      disableSelect={!hasWriteAuth}
      renderTableActions={(selectedItems) => (
        <Authorized authorizations="K8sVolumesW">
          <DeleteButton
            confirmMessage="Do you want to remove the selected storage class(es)?"
            onConfirmed={() =>
              deleteStorageClassesMutation.mutate(selectedItems)
            }
            disabled={selectedItems.length === 0}
            isLoading={deleteStorageClassesMutation.isLoading}
            data-cy="k8s-storageclasses-delete-button"
          />
          <CreateFromManifestButton data-cy="k8s-storageclasses-deploy-button" />
        </Authorized>
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
    />
  );
}
