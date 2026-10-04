import { EnvironmentsContent } from '@console/console/pages/EnvironmentsPage';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function EnvironmentsPage() {
  return (
    <>
      <PageHeader
        title="Environments"
        breadcrumbs="Environment management"
        reload
      />
      <main>
        <EnvironmentsContent />
      </main>
    </>
  );
}
