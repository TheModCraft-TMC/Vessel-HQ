import { User as UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUsers } from '@/domains/users';
import { AuthenticationMethod } from '@/domains/settings';
import { useSettings } from '@/domains/settings';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useCurrentUser } from '@/react/hooks/useUser';
import { userQueryKeys } from '@/domains/users';
import { Datatable } from '@/ui/components/data-table';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { useTeamMemberships } from '@/domains/teams';
import { TeamId, TeamRole } from '@/domains/teams';

import { deleteUser } from '../../queries/useDeleteUserMutation';

import { columns } from './columns';
import { DecoratedUser } from './types';

const store = createPersistedStore('users');

export function UsersDatatable() {
  const removeMutation = useRemoveMutation();
  const { isPureAdmin } = useCurrentUser();
  const usersQuery = useUsers(isPureAdmin);
  const membershipsQuery = useTeamMemberships();
  const settingsQuery = useSettings();
  const tableState = useTableState(store, 'users');

  const dataset: Array<DecoratedUser> | null = useMemo(() => {
    if (!usersQuery.data || !membershipsQuery.data || !settingsQuery.data) {
      return null;
    }

    const memberships = membershipsQuery.data;

    return usersQuery.data.map((user) => {
      const teamMembership = memberships.find(
        (membership) => membership.UserID === user.Id
      );

      return {
        ...user,
        isTeamLeader: teamMembership?.Role === TeamRole.Leader,
        authMethod:
          AuthenticationMethod[
            user.Id === 1
              ? AuthenticationMethod.Internal
              : settingsQuery.data.AuthenticationMethod
          ],
      };
    });
  }, [membershipsQuery.data, settingsQuery.data, usersQuery.data]);

  return (
    <Datatable
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      title="Users"
      titleIcon={UserIcon}
      settingsManager={tableState}
      isRowSelectable={(row) => row.original.Id !== 1}
      renderTableActions={(selectedUsers) => (
        <DeleteButton
          disabled={selectedUsers.length === 0}
          confirmMessage="Do you want to remove the selected users? They will not be able to login into Portainer anymore."
          onConfirmed={() =>
            removeMutation.mutate(
              selectedUsers.map((i) => i.Id),
              {
                onSuccess: () => {
                  notifySuccess('Users successfully removed', '');
                },
              }
            )
          }
          data-cy="remove-users-button"
          isLoading={removeMutation.isLoading}
        />
      )}
      data-cy="users-datatable"
    />
  );
}

function useRemoveMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (ids: TeamId[]) => processItemsInBatches(ids, deleteUser),
    mutationOptions(
      withError('Unable to remove users'),
      withInvalidate(queryClient, [userQueryKeys.base()])
    )
  );
}
