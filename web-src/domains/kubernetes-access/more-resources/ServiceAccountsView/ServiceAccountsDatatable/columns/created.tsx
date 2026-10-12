import { formatDate } from '@/shared/formatters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => formatDate(row.creationDate),
  {
    header: 'Created',
    id: 'created',
    cell: ({ getValue }) => getValue(),
  }
);
