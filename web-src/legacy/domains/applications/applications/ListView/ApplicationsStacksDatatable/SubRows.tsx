import clsx from 'clsx';

import KubernetesApplicationHelper from '@/kubernetes/helpers/application';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';
import { Link } from '@/ui/components/links/Link';
import { ExternalBadge } from '@/ui/components/status/Badge/ExternalBadge';

import { Stack } from './types';

export function SubRows({ stack, span }: { stack: Stack; span: number }) {
  return (
    <>
      {stack.Applications.map((app) => (
        <tr
          className={clsx({
            'datatable-highlighted': stack.Highlighted,
            'datatable-unhighlighted': !stack.Highlighted,
          })}
          key={app.Name}
        >
          <td />
          <td colSpan={span - 1}>
            <div className="flex gap-2">
              <Link
                to="/:endpointId/kubernetes/applications/:namespace/:name"
                params={{ name: app.Name, namespace: app.ResourcePool }}
                data-cy={`app-stack-application-link-${app.Name}`}
              >
                {app.Name}
              </Link>
              {KubernetesNamespaceHelper.isSystemNamespace(app.ResourcePool) &&
                KubernetesApplicationHelper.isExternalApplication(app) && (
                  <ExternalBadge />
                )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
