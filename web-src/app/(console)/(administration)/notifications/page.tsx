import { NotificationsContent } from '@app/_components/pages/NotificationsPage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" breadcrumbs="Notifications" reload />
      <NotificationsContent />
    </>
  );
}
