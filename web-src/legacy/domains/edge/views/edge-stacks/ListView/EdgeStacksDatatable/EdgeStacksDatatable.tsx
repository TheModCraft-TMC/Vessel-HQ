import { Layers } from 'lucide-react';

import { Datatable } from '@/ui/components/data-table';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { getColumnVisibilityState } from '@/ui/components/data-table/ColumnVisibilityMenu';
import { useEdgeStacks } from '@/domains/edge/queries/edge-stacks/useEdgeStacks';

import { createStore } from './store';
import { columns } from './columns';
import { DecoratedEdgeStack } from './types';
import { TableSettingsMenus } from './TableSettingsMenus';
import { TableActions } from './TableActions';

const tableKey = 'edge-stacks';

const settingsStore = createStore(tableKey);

export function EdgeStacksDatatable() {
  const tableState = useTableState(settingsStore, tableKey);
  const edgeStacksQuery = useEdgeStacks<Array<DecoratedEdgeStack>>({
    params: { summarizeStatuses: true },
  });

  return (
    <Datatable
      title="Edge Stacks"
      titleIcon={Layers}
      columns={columns}
      dataset={edgeStacksQuery.data || []}
      initialTableState={getColumnVisibilityState(tableState.hiddenColumns)}
      settingsManager={tableState}
      isLoading={edgeStacksQuery.isLoading}
      renderTableSettings={(tableInstance) => (
        <TableSettingsMenus
          tableInstance={tableInstance}
          tableState={tableState}
        />
      )}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} />
      )}
      data-cy="edge-stacks-datatable"
    />
  );
}
