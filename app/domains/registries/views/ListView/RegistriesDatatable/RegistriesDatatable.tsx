import { Radio } from 'lucide-react';

import { useRegistries } from '@/domains/registries/queries/useRegistries';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';

import { columns } from './columns';
import { DeleteButton } from './DeleteButton';
import { AddButton } from './AddButton';

const tableKey = 'registries';

const store = createPersistedStore(tableKey);

export function RegistriesDatatable() {
  const query = useRegistries();

  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      columns={columns}
      dataset={query.data || []}
      isLoading={query.isLoading}
      settingsManager={tableState}
      title="Registries"
      titleIcon={Radio}
      renderTableActions={(selectedItems) => (
        <>
          <DeleteButton selectedItems={selectedItems} />

          <AddButton />
        </>
      )}
      isRowSelectable={(row) => !!row.original.Id}
      data-cy="registries-datatable"
    />
  );
}
