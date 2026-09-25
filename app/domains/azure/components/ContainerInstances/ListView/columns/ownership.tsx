import clsx from 'clsx';
import { CellContext } from '@tanstack/react-table';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { ContainerGroup } from '@/domains/azure/models';
import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';

import { columnHelper } from './helper';

export const ownership = columnHelper.accessor(
  (row) =>
    row.resourceControl
      ? row.resourceControl.Ownership
      : ResourceControlOwnership.ADMINISTRATORS,
  {
    header: 'Ownership',
    cell: OwnershipCell,
    id: 'ownership',
  }
);

function OwnershipCell({
  getValue,
}: CellContext<ContainerGroup, ResourceControlOwnership>) {
  const value = getValue();

  return (
    <>
      <i
        className={clsx(ownershipIcon(value), 'space-right')}
        aria-hidden="true"
      />
      {value}
    </>
  );
}
