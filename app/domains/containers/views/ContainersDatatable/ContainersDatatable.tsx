import { Box } from 'lucide-react';

import { ContainerListViewModel } from '@/domains/containers/types';
import { useShowGPUsColumn } from '@/domains/containers/utils';
import { Environment } from '@/domains/environments';
import { Datatable, Table } from '@/ui/components/data-table';
import {
  ColumnVisibilityMenu,
  getColumnVisibilityState,
} from '@/ui/components/data-table/ColumnVisibilityMenu';
import {
  QuickActionsSettings,
  buildAction,
} from '@/ui/components/data-table/QuickActionsSettings';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';
import { withColumnFilters } from '@/ui/components/data-table/extend-options/withColumnFilters';
import { TableSettingsProvider } from '@/ui/components/data-table/useTableSettings';
import { useTableState } from '@/ui/components/data-table/useTableState';

import { useContainers } from '../../queries/useContainers';

import { ContainersDatatableActions } from './ContainersDatatableActions';
import { ContainersDatatableSettings } from './ContainersDatatableSettings';
import { RowProvider } from './RowContext';
import { useColumns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'containers';
const settingsStore = createStore(storageKey);

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
];

export interface Props {
  isHostColumnVisible: boolean;
  environment: Environment;
}

export function ContainersDatatable({
  isHostColumnVisible,
  environment,
}: Props) {
  const isGPUsColumnVisible = useShowGPUsColumn(environment);
  const columns = useColumns(isHostColumnVisible, isGPUsColumnVisible);
  const tableState = useTableState(settingsStore, storageKey);

  const containersQuery = useContainers(environment.Id, {
    autoRefreshRate: tableState.autoRefreshRateMS,
  });

  return (
    <RowProvider context={{ environment }}>
      <TableSettingsProvider settings={settingsStore}>
        <Datatable
          titleIcon={Box}
          title="Containers"
          settingsManager={tableState}
          columns={columns}
          renderTableActions={(selectedRows) => (
            <ContainersDatatableActions
              selectedItems={selectedRows}
              isAddActionVisible
              endpointId={environment.Id}
            />
          )}
          isLoading={containersQuery.isLoading}
          isRowSelectable={(row) => !row.original.IsPortainer}
          initialTableState={getColumnVisibilityState(tableState.hiddenColumns)}
          data-cy="docker-containers-datatable"
          renderTableSettings={(tableInstance) => (
            <>
              <ColumnVisibilityMenu<ContainerListViewModel>
                table={tableInstance}
                onChange={(hiddenColumns) => {
                  tableState.setHiddenColumns(hiddenColumns);
                }}
                value={tableState.hiddenColumns}
              />
              <Table.SettingsMenu
                quickActions={<QuickActionsSettings actions={actions} />}
              >
                <ContainersDatatableSettings
                  isRefreshVisible
                  settings={tableState}
                />
              </Table.SettingsMenu>
            </>
          )}
          dataset={containersQuery.data || []}
          extendTableOptions={mergeOptions(
            withColumnFilters(
              tableState.columnFilters,
              tableState.setColumnFilters
            )
          )}
        />
      </TableSettingsProvider>
    </RowProvider>
  );
}
