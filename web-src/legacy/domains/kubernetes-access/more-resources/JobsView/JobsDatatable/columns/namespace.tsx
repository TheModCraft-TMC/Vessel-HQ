import { Row } from '@tanstack/react-table';

import { filterHOC } from '@/ui/components/data-table/Filter';
import { Link } from '@/ui/components/links/Link';

import { Job } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor((row) => row.Namespace, {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue, row }) => (
    <Link
      to="/:endpointId/kubernetes/namespaces/:id"
      params={{
        id: getValue(),
      }}
      title={getValue()}
      data-cy={`cronJob-namespace-link-${row.original.Name}`}
    >
      {getValue()}
    </Link>
  ),
  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<Job>, _columnId: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.Namespace ?? ''),
});
