import { formatDate } from '@/shared/formatters';

import { columnHelper } from './helper';

export const date = columnHelper.accessor(
  (event) => formatDate(event.lastTimestamp || event.eventTime),
  {
    header: 'Date',
    id: 'Date',
  }
);
