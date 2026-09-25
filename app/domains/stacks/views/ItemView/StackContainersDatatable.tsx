import { Box } from 'lucide-react';

import type { ContainerListViewModel } from '@/domains/containers';
import {
  createContainersDatatableStore as createStore,
  useContainerColumns as useColumns,
  ContainersDatatableActions,
  ContainersDatatableSettings,
  useShowGPUsColumn,
  ContainerRowProvider as RowProvider,
} from '@/domains/containers';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { Datatable, Table } from '@/ui/components/data-table';
import {
  buildAction,
  QuickActionsSettings,
} from '@/ui/components/data-table/QuickActionsSettings';
import {
  ColumnVisibilityMenu,
  getColumnVisibilityState,
} from '@/ui/components/data-table/ColumnVisibilityMenu';
import { TableSettingsProvider } from '@/ui/components/data-table/useTableSettings';
import { useTableState } from '@/ui/components/data-table/useTableState';

import { useComposeStackContainers } from './useComposeStackContainers';

const storageKey = 'stack-containers';
const settingsStore = createStore(storageKey);

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
];

export interface Props {
  stackName: string;
}

export function StackContainersDatatable({ stackName }: Props) {
  const environmentQuery = useCurrentEnvironment();
  const tableState = useTableState(settingsStore, storageKey);

  const isGPUsColumnVisible = useShowGPUsColumn(environmentQuery.data);
  const columns = useColumns(false, isGPUsColumnVisible);

  const containersQuery = useComposeStackContainers(
    { environmentId: environmentQuery.data?.Id, stackName },
    {
      autoRefreshRate: tableState.autoRefreshRateMS,
    }
  );

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  return (
    <RowProvider context={{ environment }}>
      <TableSettingsProvider settings={settingsStore}>
        <Datatable
          title="Containers"
          titleIcon={Box}
          settingsManager={tableState}
          columns={columns}
          renderTableActions={(selectedRows) => (
            <ContainersDatatableActions
              selectedItems={selectedRows}
              isAddActionVisible={false}
              endpointId={environment.Id}
            />
          )}
          initialTableState={getColumnVisibilityState(tableState.hiddenColumns)}
          data-cy="stack-containers-datatable"
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
                <ContainersDatatableSettings settings={tableState} />
              </Table.SettingsMenu>
            </>
          )}
          dataset={containersQuery.data || []}
          isLoading={!containersQuery.data}
        />
      </TableSettingsProvider>
    </RowProvider>
  );
}
