import { formatDate } from '@/shared/formatters';

import { columnHelper } from './helper';

export const started = columnHelper.accessor(
  (row) => formatDate(row.StartTime),
  {
    header: 'Started',
    id: 'started',
    cell: ({ getValue }) => getValue() ?? '',
  }
);
