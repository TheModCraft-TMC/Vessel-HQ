import { CellContext } from '@tanstack/react-table';
import { Link } from '@console/navigation/Link';

import { ContainerGroup } from '@/domains/azure/models';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('name', {
  header: 'Name',
  cell: NameCell,
});

export function NameCell({
  getValue,
  row: { original: container },
}: CellContext<ContainerGroup, string>) {
  const name = getValue();
  return (
    <Link
      to="/:endpointId/azure/containerinstances/:id"
      params={{ id: container.id }}
      className="hover:underline"
      data-cy={`aci-container-${container.id}`}
    >
      {name}
    </Link>
  );
}
