import { EdgeJobsContent } from '@console/console/pages/EdgeListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Edge Jobs" breadcrumbs="Edge Jobs" reload />
      <EdgeJobsContent />
    </>
  );
}
