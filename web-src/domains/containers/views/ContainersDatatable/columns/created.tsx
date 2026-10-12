import { isoDateFromTimestamp } from '@/shared/formatters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => isoDateFromTimestamp(row.Created),
  {
    header: 'Created',
    id: 'created',
    cell: ({ row }) => isoDateFromTimestamp(row.original.Created),
  }
);
