import { CellContext } from '@tanstack/react-table';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import _ from 'lodash';
import { buildHref } from '@console/console/routing/buildHref';

import type { ContainerListViewModel } from '@/domains/containers/types';
import { useTableSettings } from '@/ui/components/data-table/useTableSettings';

import { TableSettings } from '../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor((row) => row.Names[0], {
  header: 'Name',
  id: 'name',
  cell: NameCell,
});

export function NameCell({
  getValue,
  row: { original: container },
}: CellContext<ContainerListViewModel, string>) {
  const name = getValue();

  const pathname = usePathname();
  const href = buildHref(
    './:id',
    { id: container.Id, nodeName: container.NodeName },
    pathname
  );

  const settings = useTableSettings<TableSettings>();
  const truncate = settings.truncateContainerName;

  let shortName = name;
  if (truncate > 0) {
    shortName = _.truncate(name, { length: truncate });
  }

  return (
    <Link href={href} title={name}>
      {shortName}
    </Link>
  );
}
