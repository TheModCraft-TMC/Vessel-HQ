import { AzureDashboardContent } from '@console/console/platform/azure/AzurePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} reload />
      <AzureDashboardContent />
    </>
  );
}
