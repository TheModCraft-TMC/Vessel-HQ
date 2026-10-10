import { ActivityLogsContent } from '@app/_components/pages/ActivityLogsPage';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function ActivityLogsPage() {
  return (
    <>
      <PageHeader
        title="User activity logs"
        breadcrumbs="User activity logs"
        reload
      />
      <ActivityLogsContent />
    </>
  );
}
