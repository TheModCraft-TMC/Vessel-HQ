'use client';

import { AzureContainerDetailsContent } from '@console/console/platform/azure/AzurePages';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Container Instance"
        breadcrumbs={[
          {
            link: '/:endpointId/azure/containerinstances',
            label: 'Container instances',
          },
          { label: params.id },
        ]}
        reload
      />
      <AzureContainerDetailsContent />
    </>
  );
}
