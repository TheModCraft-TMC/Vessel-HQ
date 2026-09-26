import { createColumnHelper } from '@tanstack/react-table';
import { Clock } from 'lucide-react';

import { EventMessage } from '@/providers/infrastructure/docker';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';

import { createEventDetails } from './model';

const columnHelper = createColumnHelper<EventMessage>();

export const columns = [
  columnHelper.accessor('time', {
    header: 'Date',
    cell: ({ getValue }) => {
      const value = getValue();
      return isoDateFromTimestamp(value);
    },
  }),
  columnHelper.accessor((c) => c.Type, {
    header: 'Type',
  }),
  columnHelper.accessor((c) => createEventDetails(c), {
    header: 'Details',
  }),
];

const tableKey = 'docker-events';
const settingsStore = createPersistedStore(tableKey, {
  id: 'Time',
  desc: true,
});

export function EventsDatatable({
  dataset,
}: {
  dataset?: Array<EventMessage>;
}) {
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <Datatable
      dataset={dataset ?? []}
      isLoading={!dataset}
      columns={columns}
      settingsManager={tableState}
      title="Events"
      titleIcon={Clock}
      disableSelect
      data-cy="docker-events-datatable"
    />
  );
}
