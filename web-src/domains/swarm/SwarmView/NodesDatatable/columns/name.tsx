import { CellContext } from '@tanstack/react-table';
import { Link } from '@console/navigation/Link';

import { NodeViewModel } from '@/domains/swarm/models/node';

import { isTableMeta } from '../types';

import { columnHelper } from './column-helper';

export const name = columnHelper.accessor('Hostname', {
  header: 'Name',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
  table: {
    options: { meta },
  },
}: CellContext<NodeViewModel, NodeViewModel['Hostname']>) {
  if (!isTableMeta(meta)) {
    throw new Error('Invalid table meta');
  }

  const value = getValue();

  if (!meta.haveAccessToNode) {
    return <>{value}</>;
  }

  return (
    <Link
      to="/:endpointId/docker/nodes/:id"
      params={{ id: item.Id }}
      data-cy={`node-link-${item.Id}`}
    >
      {value}
    </Link>
  );
}
