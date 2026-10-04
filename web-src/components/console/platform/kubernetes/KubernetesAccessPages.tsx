'use client';

import { Code, User } from 'lucide-react';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ServiceAccountDetailsWidget } from '@/domains/kubernetes-access/more-resources/ServiceAccountsView/ItemView/ServiceAccountDetailsWidget';
import { ServiceAccountYAMLEditor } from '@/domains/kubernetes-access/more-resources/ServiceAccountsView/ItemView/ServiceAccountYAMLEditor';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

export function KubernetesRegistryAccessHeader() {
  const params = useRouteParams();
  return (
    <PageHeader
      title="Registry access"
      breadcrumbs={[
        { label: 'Registries', link: '/:endpointId/kubernetes/registries' },
        params.id,
        'Access management',
      ]}
      reload
    />
  );
}

export function KubernetesServiceAccountHeader() {
  const params = useRouteParams();
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');

  return (
    <PageHeader
      title="Service account details"
      breadcrumbs={[
        {
          label: 'Service accounts',
          link: '/:endpointId/kubernetes/moreResources/serviceAccounts',
        },
        {
          label: namespace,
          link: '/:endpointId/kubernetes/namespaces/:id',
          linkParams: { id: namespace },
        },
        name,
      ]}
      reload
    />
  );
}

export function KubernetesServiceAccountContent() {
  const params = useRouteParams();
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');
  const tabs: Tab[] = [
    {
      name: 'Service account',
      icon: User,
      widget: <ServiceAccountDetailsWidget namespace={namespace} name={name} />,
      selectedTabParam: 'service-account',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <ServiceAccountYAMLEditor />,
      selectedTabParam: 'YAML',
    },
  ];
  const index = useCurrentTabIndex(tabs);
  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={index} />
      {tabs[index].widget}
    </>
  );
}
