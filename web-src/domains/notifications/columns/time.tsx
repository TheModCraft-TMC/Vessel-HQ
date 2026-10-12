import { isoDate } from '@/shared/formatters';

import { columnHelper } from './helper';

export const time = columnHelper.accessor('timeStamp', {
  header: 'Time',
  id: 'time',
  cell: ({ getValue }) => {
    const value = getValue();

    return value ? isoDate(value) : '-';
  },
});
