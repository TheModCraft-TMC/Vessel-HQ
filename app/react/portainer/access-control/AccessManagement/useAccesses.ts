import { useMemo } from 'react';
import _ from 'lodash';

import {
  TeamAccessViewModel,
  UserAccessViewModel,
} from '@/portainer/models/access';
import { useUsers } from '@/portainer/users/queries';
import { useTeams } from '@/react/portainer/users/teams/queries/useTeams';
import { useRbacRoles } from '@/react/portainer/users/RolesView/useRbacRoles';

import { Access } from './AccessDatatable/types';

type AccessPolicies = Record<number, { RoleId?: number }>;

interface AccessControlledEntity {
  UserAccessPolicies?: AccessPolicies | null;
  TeamAccessPolicies?: AccessPolicies | null;
}

/** Loads users and teams and resolves direct, inherited, and overridden access. */
export function useAccesses(
  entity?: AccessControlledEntity | null,
  parent?: AccessControlledEntity | null
) {
  const usersQuery = useUsers(false, 0, !!entity, (users) =>
    users.map((user) => new UserAccessViewModel(user))
  );
  const teamsQuery = useTeams(false, 0, {
    enabled: !!entity,
    select: (teams) => teams.map((team) => new TeamAccessViewModel(team)),
  });
  const rolesQuery = useRbacRoles();

  const accesses = useMemo(() => {
    const available: Array<Access> = [];
    const authorized: Array<Access> = [];
    const roles = new Map(
      (rolesQuery.data || []).map((role) => [role.Id, role.Name])
    );

    for (const access of [
      ...(usersQuery.data || []),
      ...(teamsQuery.data || []),
    ] as Array<Access>) {
      const ownPolicies =
        access.Type === 'user'
          ? entity?.UserAccessPolicies
          : entity?.TeamAccessPolicies;
      const inheritedPolicies =
        access.Type === 'user'
          ? parent?.UserAccessPolicies
          : parent?.TeamAccessPolicies;
      const ownPolicy = ownPolicies?.[access.Id];
      const inheritedPolicy = inheritedPolicies?.[access.Id];
      const policy = ownPolicy || inheritedPolicy;
      const item = {
        ...access,
        Inherited: !ownPolicy && !!inheritedPolicy,
        Override: !!ownPolicy && !!inheritedPolicy,
        Role: {
          Id: policy?.RoleId || 0,
          Name: roles.get(policy?.RoleId || 0) || '-',
        },
      } as Access;

      if (ownPolicy || inheritedPolicy) {
        authorized.push(item);
      }
      if (!ownPolicy) {
        available.push(item);
      }
    }

    return {
      authorizedUsersAndTeams: authorized,
      availableUsersAndTeams: _.orderBy(available, 'Name', 'asc'),
    };
  }, [
    entity?.UserAccessPolicies,
    entity?.TeamAccessPolicies,
    parent?.UserAccessPolicies,
    parent?.TeamAccessPolicies,
    rolesQuery.data,
    teamsQuery.data,
    usersQuery.data,
  ]);

  return {
    ...accesses,
    isLoading:
      usersQuery.isLoading || teamsQuery.isLoading || rolesQuery.isLoading,
  };
}
