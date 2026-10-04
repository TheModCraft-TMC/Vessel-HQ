import { EdgeGroupsContent } from '@console/console/pages/EdgeListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Edge Groups" breadcrumbs="Edge Groups" reload />
      <EdgeGroupsContent />
    </>
  );
}
