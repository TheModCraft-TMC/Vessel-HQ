import { AzureContainerCreateContent } from '@console/console/platform/azure/AzurePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create container instance"
        breadcrumbs={[
          {
            link: '/:endpointId/azure/containerinstances',
            label: 'Container instances',
          },
          { label: 'Add container' },
        ]}
        reload
      />
      <AzureContainerCreateContent />
    </>
  );
}
