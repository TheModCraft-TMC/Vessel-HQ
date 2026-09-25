import { useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';

import { User, UserId } from '@/domains/users';
import { useCurrentUser } from '@/react/hooks/useUser';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { useAddMemberMutation } from '@/domains/teams';
import { TeamId } from '@/domains/teams';
import { Button } from '@/ui/components/buttons';
import { Datatable } from '@/ui/components/data-table';

import { name } from './name-column';
import { RowProvider } from './RowContext';

const columns = [name];

interface Props {
  users: User[];
  disabled?: boolean;
  teamId: TeamId;
}

export function UsersList({ users, disabled, teamId }: Props) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const addMemberMutation = useAddMemberMutation(teamId);
  const [sortBy, setSortBy] = useState<
    { id: string; desc: boolean } | undefined
  >({ id: 'name', desc: false });

  const { isPureAdmin } = useCurrentUser();

  const rowContext = useMemo(() => ({ disabled, teamId }), [disabled, teamId]);

  return (
    <RowProvider context={rowContext}>
      <Datatable<User>
        dataset={users}
        columns={columns}
        titleIcon={Users}
        title="Users"
        renderTableActions={() =>
          isPureAdmin && (
            <Button
              onClick={() => handleAddAllMembers(users.map((u) => u.Id))}
              disabled={disabled || users.length === 0}
              icon={UserPlus}
              data-cy="add-all-users-button"
            >
              Add all users
            </Button>
          )
        }
        disableSelect
        settingsManager={{
          pageSize,
          setPageSize,
          sortBy,
          setSortBy: handleSetSort,
          search,
          setSearch,
        }}
        data-cy="users-datatable"
      />
    </RowProvider>
  );

  function handleSetSort(colId: string | undefined, desc: boolean) {
    setSortBy(colId ? { id: colId, desc } : undefined);
  }

  function handleAddAllMembers(userIds: UserId[]) {
    addMemberMutation.mutate(userIds, {
      onSuccess() {
        notifySuccess('Success', 'All users successfully added');
      },
    });
  }
}
