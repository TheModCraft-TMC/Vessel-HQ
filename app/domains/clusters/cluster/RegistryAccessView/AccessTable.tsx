import { UserX } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

type Item = { value: string };

const columnHelper = createColumnHelper<Item>();

const columns = [
  columnHelper.accessor('value', {
    header: 'Namespace',
  }),
];

const tableKey = 'kube-access-table';

const store = createPersistedStore(tableKey);

export function AccessTable({
  dataset,
  onRemove,
}: {
  dataset: Array<Item>;
  onRemove: (selectedItems: Array<Item>) => void;
}) {
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      title="Access"
      titleIcon={UserX}
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      getRowId={(row) => row.value}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          disabled={selectedItems.length === 0}
          confirmMessage={
            <>
              <p>
                This registry might be used by one or more applications inside
                this environment. Removing the registry access could lead to a
                service interruption for these applications.
              </p>
              <p>Are you sure you wish to continue?</p>
            </>
          }
          onConfirmed={() => onRemove(selectedItems)}
          data-cy="remove-registry-access-button"
        />
      )}
      data-cy="registry-access-datatable"
    />
  );
}
