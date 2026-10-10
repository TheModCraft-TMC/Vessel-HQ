import { UpdateScheduleCreateContent } from '@app/_components/pages/UpdateScheduleEditorPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs="Edge agent update and rollback"
        reload
      />
      <UpdateScheduleCreateContent />
    </>
  );
}
