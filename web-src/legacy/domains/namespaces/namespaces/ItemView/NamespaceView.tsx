import { useRouteParams } from '@console/console/routing/useRouteParams';
import { AlertTriangle, Code, Layers, History } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespaceAccessRedirect } from '@/domains/namespaces';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Badge } from '@/ui/components/status/Badge';
import { Icon } from '@/ui/components/icons/Icon';
import {
  ResourceEventsDatatable,
  useEventWarningsCount,
} from '@/domains/clusters';

import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

import { NamespaceYAMLEditor } from '../components/NamespaceYamlEditor';

import { UpdateNamespaceForm } from './UpdateNamespaceForm';
import { NamespaceAppsDatatable } from './NamespaceAppsDatatable';

export function NamespaceView() {
  const { id: namespace } = useRouteParams();
  useNamespaceAccessRedirect(namespace, {
    to: '/:endpointId/kubernetes/namespaces',
  });

  const environmentId = useEnvironmentId();
  const eventWarningCount = useEventWarningsCount(environmentId, { namespace });

  const tabs: Tab[] = [
    {
      name: 'Namespace',
      icon: Layers,
      widget: <UpdateNamespaceForm />,
      selectedTabParam: 'namespace',
    },
    {
      name: (
        <div className="flex items-center gap-x-2">
          Events
          {eventWarningCount >= 1 && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />
              {eventWarningCount}
            </Badge>
          )}
        </div>
      ),
      icon: History,
      widget: (
        <ResourceEventsDatatable
          namespace={namespace}
          storageKey="kubernetes.namespace.events"
          noWidget={false}
        />
      ),
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <NamespaceYAMLEditor />,
      selectedTabParam: 'YAML',
    },
  ];
  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader
        title="Namespace details"
        breadcrumbs={[
          { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
          namespace,
        ]}
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        {tabs[currentTabIndex].widget}
        <NamespaceAppsDatatable namespace={namespace} />
      </>
    </>
  );
}
