import LaptopCode from '@/assets/ico/laptop-code.svg?c';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import { useRepeater } from '@/ui/components/data-table/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@/ui/components/data-table/types';

import { columns } from './columns';
import { IntegratedApp } from './types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function IntegratedAppsDatatable({
  dataset,
  onRefresh,
  isLoading,
  tableKey,
  tableTitle,
  dataCy,
}: {
  dataset: Array<IntegratedApp>;
  onRefresh: () => void;
  isLoading: boolean;
  tableKey: string;
  tableTitle: string;
  dataCy: string;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    tableKey,
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
  useRepeater(tableState.autoRefreshRateMS, onRefresh);

  return (
    <Datatable
      dataset={dataset}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title={tableTitle}
      titleIcon={LaptopCode}
      isLoading={isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy={dataCy}
    />
  );
}
