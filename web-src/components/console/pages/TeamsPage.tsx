'use client';

import { CreateTeamForm } from '@/domains/teams/ListView/CreateTeamForm';
import { TeamsDatatable } from '@/domains/teams/ListView/TeamsDatatable';
import { useTeams } from '@/domains/teams/queries';
import { useUsers } from '@/domains/users';
import { useCurrentUser } from '@/react/hooks/useUser';

export function TeamsContent() {
  const { isPureAdmin } = useCurrentUser();
  const usersQuery = useUsers(false);
  const teamsQuery = useTeams(!isPureAdmin, 0);

  return (
    <>
      {isPureAdmin && usersQuery.data && teamsQuery.data && (
        <CreateTeamForm users={usersQuery.data} teams={teamsQuery.data} />
      )}
      {teamsQuery.data && (
        <TeamsDatatable teams={teamsQuery.data} isAdmin={isPureAdmin} />
      )}
    </>
  );
}
