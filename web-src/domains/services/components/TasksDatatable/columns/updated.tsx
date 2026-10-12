import { isoDate } from '@/shared/formatters';

import { columnHelper } from './helper';

export const updated = columnHelper.accessor('Updated', {
  header: 'Last Update',
  cell: ({ getValue }) => isoDate(getValue()),
});
