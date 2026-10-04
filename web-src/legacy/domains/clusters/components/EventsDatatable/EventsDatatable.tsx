import { History } from 'lucide-react';
import { ReactNode } from 'react';

import type { Event } from '@/domains/clusters/models/event';
import type { IndexOptional } from '@/domains/configuration';
import { TableSettings } from '@/domains/clusters/datatables/DefaultDatatableSettings';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import type { IconSource } from '@/ui/components/icons/Icon';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { TableState } from '@/ui/components/data-table/useTableState';

import { columns } from './columns';

type Props = {
  dataset: Event[];
  tableState: TableState<TableSettings>;
  isLoading: boolean;
  'data-cy': string;
  noWidget?: boolean;
  title?: ReactNode;
  titleIcon?: IconSource;
};

export function EventsDatatable({
  dataset,
  tableState,
  isLoading,
  'data-cy': dataCy,
  noWidget,
  title = 'Events',
  titleIcon = History,
}: Props) {
  return (
    <Datatable<IndexOptional<Event>>
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      isLoading={isLoading}
      title={title}
      titleIcon={titleIcon}
      getRowId={(row) => row.uid || ''}
      disableSelect
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      data-cy={dataCy}
      noWidget={noWidget}
    />
  );
}
