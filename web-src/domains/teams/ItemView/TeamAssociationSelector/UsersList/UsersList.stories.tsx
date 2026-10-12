import { Meta } from '@storybook/react-webpack5';
import { useMemo } from 'react';

import { createMockUsers } from '@/core/test-support/test-mocks';
import { Role } from '@/domains/users';
import { UserContext } from '@/core/session/useUser';
import { UserViewModel } from '@/domains/users';

import { UsersList } from './UsersList';

const meta: Meta = {
  title: 'Components/Teams/TeamAssociationSelector/UsersList',
  component: UsersList,
};

export default meta;

export { Example };

interface Args {
  userRole: Role;
}

function Example({ userRole }: Args) {
  const userProviderState = useMemo(
    () => ({ user: new UserViewModel({ Role: userRole }) }),
    [userRole]
  );

  const users = createMockUsers(20, Role.Standard);

  return (
    <UserContext.Provider value={userProviderState}>
      <UsersList users={users} teamId={3} />
    </UserContext.Provider>
  );
}

Example.args = {
  userRole: Role.Admin,
};
