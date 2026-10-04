import { UpdateSchedulesContent } from '@console/console/pages/UpdateSchedulesPage';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs="Update and rollback"
        reload
      />
      <UpdateSchedulesContent />
    </>
  );
}
