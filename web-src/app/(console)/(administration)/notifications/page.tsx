import { NotificationsContent } from '@console/console/pages/NotificationsPage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" breadcrumbs="Notifications" reload />
      <NotificationsContent />
    </>
  );
}
