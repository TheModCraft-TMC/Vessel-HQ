import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { Team, TeamId } from '@/domains/teams';
import { Datatable } from '@/ui/components/data-table';
import { buildNameColumn } from '@/ui/components/data-table/buildNameColumn';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

import { deleteTeam } from '../../queries/useDeleteTeamMutation';

const storageKey = 'teams';

const columns: ColumnDef<Team>[] = [
  buildNameColumn<Team>('Name', '/teams/:id', 'teams-name'),
];

interface Props {
  teams: Team[];
  isAdmin: boolean;
}

const settingsStore = createPersistedStore(storageKey, 'name');

export function TeamsDatatable({ teams, isAdmin }: Props) {
  const { handleRemove } = useRemoveMutation();
  const tableState = useTableState(settingsStore, storageKey);

  return (
    <Datatable<Team>
      dataset={teams}
      columns={columns}
      settingsManager={tableState}
      title="Teams"
      titleIcon={Users}
      renderTableActions={(selectedRows) =>
        isAdmin && (
          <DeleteButton
            onConfirmed={() => handleRemoveClick(selectedRows)}
            disabled={selectedRows.length === 0}
            confirmMessage="Are you sure you want to remove the selected teams?"
            data-cy="remove-teams-button"
          />
        )
      }
      data-cy="teams-datatable"
    />
  );

  function handleRemoveClick(selectedRows: Team[]) {
    const ids = selectedRows.map((row) => row.Id);
    handleRemove(ids);
  }
}

function useRemoveMutation() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    async (ids: TeamId[]) =>
      promiseSequence(ids.map((id) => () => deleteTeam(id))),
    {
      meta: {
        error: { title: 'Failure', message: 'Unable to remove team' },
      },
      onSuccess() {
        return queryClient.invalidateQueries(['teams']);
      },
    }
  );

  return { handleRemove };

  async function handleRemove(teams: TeamId[]) {
    deleteMutation.mutate(teams, {
      onSuccess: () => {
        notifySuccess('Teams successfully removed', '');
      },
    });
  }
}
