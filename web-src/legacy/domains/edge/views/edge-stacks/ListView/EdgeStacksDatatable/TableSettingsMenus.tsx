import { Table } from '@tanstack/react-table';

import { ColumnVisibilityMenu } from '@/ui/components/data-table/ColumnVisibilityMenu';
import { TableSettingsMenu } from '@/ui/components/data-table';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';

import { DecoratedEdgeStack } from './types';
import { TableSettings } from './store';

export function TableSettingsMenus({
  tableInstance,
  tableState,
}: {
  tableInstance: Table<DecoratedEdgeStack>;
  tableState: TableSettings;
}) {
  return (
    <>
      <ColumnVisibilityMenu<DecoratedEdgeStack>
        table={tableInstance}
        onChange={(hiddenColumns) => {
          tableState.setHiddenColumns(hiddenColumns);
        }}
        value={tableState.hiddenColumns}
      />
      <TableSettingsMenu>
        <TableSettingsMenuAutoRefresh
          value={tableState.autoRefreshRateMS}
          onChange={(value) => tableState.setAutoRefreshRate(value)}
        />
      </TableSettingsMenu>
    </>
  );
}
