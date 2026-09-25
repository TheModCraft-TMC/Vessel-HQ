import { useTeams } from '@/domains/teams';
import { useUsers } from '@/domains/users';
import { EnvironmentId } from '@/domains/environments';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';

export function useLoadState(environmentId?: EnvironmentId) {
  const isAdminQuery = useIsEdgeAdmin();
  const teams = useTeams(false, environmentId);

  const users = useUsers(false, environmentId, isAdminQuery.isAdmin);

  return {
    teams: teams.data,
    users: users.data,
    isAdmin: isAdminQuery.isAdmin,
    isLoading:
      teams.isInitialLoading ||
      users.isInitialLoading ||
      isAdminQuery.isLoading,
  };
}
