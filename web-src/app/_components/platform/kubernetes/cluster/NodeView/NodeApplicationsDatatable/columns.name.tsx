import { CellContext } from '@tanstack/react-table';

import { isExternalApplication } from '@/domains/applications';
import { useIsSystemNamespace } from '@/domains/namespaces';
import type { Application } from '@/domains/applications';
import { Link } from '@/ui/components/links/Link';
import { SystemBadge } from '@/ui/components/status/Badge/SystemBadge';
import { ExternalBadge } from '@/ui/components/status/Badge/ExternalBadge';

import { helper } from './columns.helper';

export const name = helper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<Application, string>) {
  const isSystem = useIsSystemNamespace(item.ResourcePool);
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/:endpointId/kubernetes/applications/:namespace/:name"
        params={{ name: item.Name, namespace: item.ResourcePool }}
        data-cy={`application-link-${item.Name}`}
      >
        {item.Name}
      </Link>

      {isSystem ? (
        <SystemBadge className="ml-auto" />
      ) : (
        isExternalApplication({ metadata: item.Metadata }) && (
          <ExternalBadge className="ml-auto" />
        )
      )}
    </div>
  );
}
