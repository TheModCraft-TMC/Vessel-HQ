import { Row } from '@tanstack/react-table';

import { Link } from '@/ui/components/links/Link';
import { filterHOC } from '@/ui/components/data-table/Filter';

import { RoleBinding } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor((row) => row.namespace, {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue }) => (
    <Link
      to="kubernetes.resourcePools.resourcePool"
      params={{
        id: getValue(),
      }}
      data-cy={`role-binding-namespace-link-${getValue()}`}
    >
      {getValue()}
    </Link>
  ),
  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<RoleBinding>, _columnId: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.namespace ?? ''),
});
