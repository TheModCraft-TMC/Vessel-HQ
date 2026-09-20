import { Table } from '@tanstack/react-table';

import { ServiceViewModel } from '@/docker/models/service';

import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';

import { type TableSettings as TableSettingsType } from './types';

export function TableSettings({
  settings,
  table,
}: {
  settings: TableSettingsType;
  table: Table<ServiceViewModel>;
}) {
  return (
    <ColumnVisibilityMenu<ServiceViewModel>
      table={table}
      onChange={(hiddenColumns) => {
        settings.setHiddenColumns(hiddenColumns);
      }}
      value={settings.hiddenColumns}
    />
  );
}
