import { CellContext } from '@tanstack/react-table';

import { useIsSystemNamespace } from '@/domains/namespaces';
import { EdgeStackBadge } from '@/domains/applications/applications/ListView/ApplicationsDatatable/EdgeStackBadge';
import { Link } from '@/ui/components/links/Link';
import { SystemBadge } from '@/ui/components/status/Badge/SystemBadge';
import { ExternalBadge } from '@/ui/components/status/Badge/ExternalBadge';
import { WorkflowBadge } from '@/ui/components/status/Badge/WorkflowBadge';

import { helper } from './columns.helper';
import { ApplicationRowData } from './types';
import { getTableMeta } from './meta';

export const name = helper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({
  row: { original: item },
  table,
}: CellContext<ApplicationRowData, string>) {
  const { isWorkflowManaged } = getTableMeta(table.options.meta);
  const isSystem = useIsSystemNamespace(item.ResourcePool);
  const isEdgeStack = !isSystem && item.StackKind === 'edge';

  return (
    <div className="flex items-center gap-2">
      {item.KubernetesApplications ? (
        <Link
          data-cy="application-helm-link"
          to="kubernetes.helm"
          params={{
            name: item.Name,
            namespace: item.HelmReleaseNamespace ?? item.ResourcePool,
          }}
        >
          {item.Name}
        </Link>
      ) : (
        <Link
          data-cy="application-link"
          to="kubernetes.applications.application"
          params={{
            name: item.Name,
            namespace: item.ResourcePool,
            'resource-type': item.ApplicationType,
          }}
        >
          {item.Name}
        </Link>
      )}

      {isSystem && <SystemBadge className="ml-auto" />}
      {isEdgeStack && <EdgeStackBadge className="ml-auto" />}
      {!isSystem && !item.ApplicationOwner && (
        <ExternalBadge className="ml-auto" />
      )}
      {isWorkflowManaged(item) && <WorkflowBadge className="ml-auto" />}
    </div>
  );
}
