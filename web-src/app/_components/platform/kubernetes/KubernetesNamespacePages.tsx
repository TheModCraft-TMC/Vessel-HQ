'use client';

import { AlertTriangle, Code, History, Layers } from 'lucide-react';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import {
  ResourceEventsDatatable,
  useEventWarningsCount,
} from '@/domains/clusters';
import { useNamespaceAccessRedirect } from '@/domains/namespaces';
import { AccessDatatable } from '@/domains/namespaces/namespaces/AccessView/AccessDatatable/AccessDatatable';
import { CreateAccessWidget } from '@/domains/namespaces/namespaces/AccessView/CreateAccessWidget/CreateAccessWidget';
import { NamespaceDetailsWidget } from '@/domains/namespaces/namespaces/AccessView/NamespaceDetailsWidget';
import { CreateNamespaceForm } from '@/domains/namespaces/namespaces/CreateView/CreateNamespaceForm';
import { NamespaceAppsDatatable } from '@/domains/namespaces/namespaces/ItemView/NamespaceAppsDatatable';
import { UpdateNamespaceForm } from '@/domains/namespaces/namespaces/ItemView/UpdateNamespaceForm';
import { NamespaceYAMLEditor } from '@/domains/namespaces/namespaces/components/NamespaceYamlEditor';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { Icon } from '@/ui/components/icons/Icon';
import { Badge } from '@/ui/components/status/Badge';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

export function KubernetesNamespaceCreateContent() {
  const environmentId = useEnvironmentId();
  useUnauthorizedRedirect(
    { authorizations: 'K8sResourcePoolsW', adminOnlyCE: !isBE },
    { to: '/:endpointId/kubernetes/namespaces', params: { id: environmentId } }
  );
  return (
    <div className="form-horizontal">
      <div className="row">
        <div className="col-sm-12">
          <CreateNamespaceForm />
        </div>
      </div>
    </div>
  );
}

export function KubernetesNamespaceHeader() {
  const params = useRouteParams();
  const namespace = String(params.id || '');

  return (
    <PageHeader
      title="Namespace details"
      breadcrumbs={[
        { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
        namespace,
      ]}
      reload
    />
  );
}

export function KubernetesNamespaceContent() {
  const params = useRouteParams();
  const namespace = String(params.id || '');
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
  const index = useCurrentTabIndex(tabs);
  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={index} />
      {tabs[index].widget}
      <NamespaceAppsDatatable namespace={namespace} />
    </>
  );
}

export function KubernetesNamespaceAccessHeader() {
  const params = useRouteParams();
  const namespace = String(params.id || '');

  return (
    <PageHeader
      title="Namespace access management"
      breadcrumbs={[
        { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
        {
          label: namespace,
          link: '/:endpointId/kubernetes/namespaces/:id',
          linkParams: { id: namespace },
        },
        'Access management',
      ]}
      reload
    />
  );
}

export function KubernetesNamespaceAccessContent() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sResourcePoolDetailsW'] },
    { to: '/:endpointId/kubernetes/namespaces' }
  );
  return (
    <>
      <NamespaceDetailsWidget />
      <CreateAccessWidget />
      <AccessDatatable />
    </>
  );
}
