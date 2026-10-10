'use client';

import { NewUserForm } from '@/domains/users/ListView/NewUserForm/NewUserForm';
import { UsersDatatable } from '@/domains/users/ListView/UsersDatatable/UsersDatatable';

export function UsersContent() {
  return (
    <>
      <NewUserForm />
      <UsersDatatable />
    </>
  );
}
