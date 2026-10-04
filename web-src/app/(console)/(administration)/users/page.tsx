import { UsersContent } from '@console/console/pages/UsersPage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Users" breadcrumbs="User management" reload />
      <UsersContent />
    </>
  );
}
