import { useRouteParams } from '@console/console/routing/useRouteParams';
import { Code, User } from 'lucide-react';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { WidgetTabs, useCurrentTabIndex, Tab } from '@@/Widget/WidgetTabs';

import { ServiceAccountDetailsWidget } from './ServiceAccountDetailsWidget';
import { ServiceAccountYAMLEditor } from './ServiceAccountYAMLEditor';

export function ServiceAccountView() {
  const { namespace, name } = useRouteParams();

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

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
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
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}
