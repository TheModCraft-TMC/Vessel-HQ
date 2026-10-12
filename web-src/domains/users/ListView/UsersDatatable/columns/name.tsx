import { CellContext } from '@tanstack/react-table';
import { Link } from '@console/navigation/Link';

import { useCurrentUser } from '@/core/session/useUser';

import { DecoratedUser } from '../types';

import { helper } from './helper';

export const name = helper.accessor('Username', {
  header: 'Name',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
}: CellContext<DecoratedUser, 'string'>) {
  const { isPureAdmin } = useCurrentUser();
  const name = getValue();

  if (!isPureAdmin) {
    return <>{name}</>;
  }

  return (
    <Link
      to="./:id"
      params={{ id: item.Id }}
      data-cy={`user-link-${item.Username}`}
    >
      {name}
    </Link>
  );
}
