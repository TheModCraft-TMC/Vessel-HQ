import { UpdateSchedulesContent } from '@app/_components/pages/UpdateSchedulesPage';
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
