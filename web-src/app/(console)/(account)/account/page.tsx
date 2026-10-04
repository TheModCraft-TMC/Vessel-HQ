import { AccountContent } from '@console/console/pages/AccountPage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function UserAccountPage() {
  return (
    <>
      <PageHeader title="User settings" breadcrumbs="User settings" reload />
      <AccountContent />
    </>
  );
}
