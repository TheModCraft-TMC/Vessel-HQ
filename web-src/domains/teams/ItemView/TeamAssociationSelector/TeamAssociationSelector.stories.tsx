import { Meta } from '@storybook/react';
import { useMemo, useState } from 'react';

import { createMockUsers } from '@/core/test-support/test-mocks';
import { Role } from '@/domains/users';
import { UserViewModel } from '@/domains/users';
import { UserContext } from '@/core/session/useUser';

import { TeamMembership, TeamRole } from '../../types';

import { TeamAssociationSelector } from './TeamAssociationSelector';

const meta: Meta = {
  title: 'Components/Teams/TeamAssociationSelector',
  component: TeamAssociationSelector,
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
  const [users] = useState(createMockUsers(20, Role.Standard));

  const [memberships] = useState<Omit<TeamMembership, 'Id' | 'TeamID'>[]>(
    // Deterministic mix of members and leaders keeps the story reproducible.
    users
      .filter((_, index) => index % 2 === 0)
      .map((u, index) => ({
        UserID: u.Id,
        Role: index % 3 === 0 ? TeamRole.Leader : TeamRole.Member,
      }))
  );

  return (
    <UserContext.Provider value={userProviderState}>
      <TeamAssociationSelector
        teamId={3}
        users={users}
        memberships={memberships as TeamMembership[]}
      />
    </UserContext.Provider>
  );
}

Example.args = {
  userRole: TeamRole.Leader,
};
