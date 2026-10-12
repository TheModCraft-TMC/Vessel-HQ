import { PlusCircle } from 'lucide-react';
import { CellContext, ColumnDef } from '@tanstack/react-table';

import { User } from '@/domains/users';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { useAddMemberMutation } from '@/domains/teams';
import { Button } from '@/ui/components/buttons';

import { useRowContext } from './RowContext';

export const name: ColumnDef<User, string> = {
  header: 'Name',
  accessorFn: (row) => row.Username,
  id: 'name',
  cell: NameCell,
};

export function NameCell({
  getValue,
  row: { original: user },
}: CellContext<User, string>) {
  const name = getValue();
  const { disabled, teamId } = useRowContext();

  const addMemberMutation = useAddMemberMutation(teamId);

  return (
    <>
      {name}

      <Button
        color="link"
        data-cy={`add-member-${user.Username}`}
        className="space-left nopadding"
        disabled={disabled}
        icon={PlusCircle}
        onClick={() => handleAddMember()}
      >
        Add
      </Button>
    </>
  );

  function handleAddMember() {
    addMemberMutation.mutate([user.Id], {
      onSuccess() {
        notifySuccess('User added to team', name);
      },
    });
  }
}
