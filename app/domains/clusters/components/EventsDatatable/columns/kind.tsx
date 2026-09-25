import { Row } from '@tanstack/react-table';

import type { Event } from '@/domains/clusters/models/event';
import { filterHOC } from '@/ui/components/data-table/Filter';

import { columnHelper } from './helper';

export const kind = columnHelper.accessor(
  (event) => event.involvedObject.kind,
  {
    header: 'Kind',
    meta: {
      filter: filterHOC('Filter by kind'),
    },
    enableColumnFilter: true,
    filterFn: (row: Row<Event>, _: string, filterValue: string[]) =>
      filterValue.length === 0 ||
      (!!row.original.involvedObject.kind &&
        filterValue.includes(row.original.involvedObject.kind)),
  }
);
