import { CellContext } from '@tanstack/react-table';

import { DecoratedRegistry } from '@/domains/registries/views/ListView/RegistriesDatatable/types';
import { columnHelper } from '@/domains/registries/views/ListView/RegistriesDatatable/columns/helper';
import { NameCell } from '@/domains/registries/views/ListView/RegistriesDatatable/columns/name';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, string>) {
  return <NameCell item={item} />;
}
