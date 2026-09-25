import clsx from 'clsx';

import { taskStatusBadge } from '@/docker/filters/utils';
import { multiple } from '@/ui/components/data-table/filter-types';
import { filterHOC } from '@/ui/components/data-table/Filter';

import { columnHelper } from './helper';

export const status = columnHelper.accessor((item) => item.Status?.State, {
  header: 'Status',
  enableColumnFilter: true,
  filterFn: multiple,
  meta: {
    filter: filterHOC('Filter by state'),
    width: 100,
  },
  cell({ getValue }) {
    const value = getValue();

    return (
      <span className={clsx('label', `label-${taskStatusBadge(value)}`)}>
        {value}
      </span>
    );
  },
});
