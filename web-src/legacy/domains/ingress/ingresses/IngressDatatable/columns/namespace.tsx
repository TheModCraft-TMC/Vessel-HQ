import { CellContext, Row } from '@tanstack/react-table';

import { filterHOC } from '@/ui/components/data-table/Filter';
import { Link } from '@/ui/components/links/Link';

import { Ingress } from '../../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('Namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: Cell,
  filterFn: (row: Row<Ingress>, columnId: string, filterValue: string[]) => {
    if (filterValue.length === 0) {
      return true;
    }
    return filterValue.includes(row.original.Namespace);
  },

  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
});

function Cell({ getValue, row }: CellContext<Ingress, string>) {
  const namespace = getValue();
  return (
    <Link
      to="/:endpointId/kubernetes/namespaces/:id"
      params={{
        id: namespace,
      }}
      title={namespace}
      data-cy={`ingress-namespace-link-${row.original.Name}`}
    >
      {namespace}
    </Link>
  );
}
