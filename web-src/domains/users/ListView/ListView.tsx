import { PageHeader } from '@/ui/layouts/view-layout';

import { NewUserForm } from './NewUserForm/NewUserForm';
import { UsersDatatable } from './UsersDatatable/UsersDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Users" breadcrumbs="User management" reload />

      <NewUserForm />

      <UsersDatatable />
    </>
  );
}
