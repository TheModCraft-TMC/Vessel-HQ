import { AzureContainersContent } from '@console/console/platform/azure/AzurePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Container list"
        breadcrumbs="Container instances"
        reload
      />
      <AzureContainersContent />
    </>
  );
}
