import { RolesContent } from '@console/console/pages/RolesPage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function RolesPage() {
  return (
    <>
      <PageHeader title="Roles" breadcrumbs="Role management" reload />
      <RolesContent />
    </>
  );
}
