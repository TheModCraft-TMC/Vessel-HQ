import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';
import { SystemBadge } from '@/ui/components/status/Badge/SystemBadge';
import { Link } from '@/ui/components/links/Link';

import { Ingress } from '../../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: Cell,
  id: 'name',
});

function Cell({ row, getValue }: CellContext<Ingress, string>) {
  const name = getValue();
  const namespace = row.original.Namespace;

  return (
    <div className="flex flex-nowrap gap-2 whitespace-nowrap">
      <Authorized authorizations="K8sIngressesW" childrenUnauthorized={name}>
        <Link
          to="/:endpointId/kubernetes/ingresses/:namespace/:name/edit"
          params={{
            uid: row.original.UID,
            namespace,
            name,
          }}
          title={name}
          data-cy={`ingress-name-link-${name}`}
        >
          {name}
        </Link>
      </Authorized>
      {row.original.IsSystem && <SystemBadge className="ml-auto" />}
    </div>
  );
}
