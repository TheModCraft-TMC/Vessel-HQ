import { Box } from 'lucide-react';

import { ContainerListViewModel } from '@/domains/containers/types';
import { createStore } from '@/domains/containers/ListView/ContainersDatatable/datatable-store';
import { useColumns } from '@/domains/containers/ListView/ContainersDatatable/columns';
import { ContainersDatatableActions } from '@/domains/containers/ListView/ContainersDatatable/ContainersDatatableActions';
import { ContainersDatatableSettings } from '@/domains/containers/ListView/ContainersDatatable/ContainersDatatableSettings';
import { useShowGPUsColumn } from '@/domains/containers/utils';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { RowProvider } from '@/domains/containers/ListView/ContainersDatatable/RowContext';

import { Datatable, Table } from '@@/datatables';
import {
  buildAction,
  QuickActionsSettings,
} from '@@/datatables/QuickActionsSettings';
import {
  ColumnVisibilityMenu,
  getColumnVisibilityState,
} from '@@/datatables/ColumnVisibilityMenu';
import { TableSettingsProvider } from '@@/datatables/useTableSettings';
import { useTableState } from '@@/datatables/useTableState';


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
