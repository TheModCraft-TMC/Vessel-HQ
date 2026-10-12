import { formatDate } from '@/shared/formatters';
import { FORMAT } from '@/core/components/DateTimeField';

import { columnHelper } from './helper';

export const scheduledTime = columnHelper.accessor('scheduledTime', {
  header: 'Scheduled Time & Date',
  // make sure the value has the right format
  cell: ({ getValue }) => formatDate(getValue(), FORMAT, FORMAT),
  id: 'time',
});
