'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';

import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { BetaAlert } from '@/react/portainer/environments/update-schedules/common/BetaAlert';
import { columns } from '@/react/portainer/environments/update-schedules/ListView/columns';
import { createStore } from '@/react/portainer/environments/update-schedules/ListView/datatable-store';
import { DecoratedItem } from '@/react/portainer/environments/update-schedules/ListView/types';
import { useList } from '@/react/portainer/environments/update-schedules/queries/list';
import { useRemoveMutation } from '@/react/portainer/environments/update-schedules/queries/useRemoveMutation';
import {
  EdgeUpdateSchedule,
  StatusType,
} from '@/react/portainer/environments/update-schedules/types';
import { AddButton } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { Datatable } from '@/ui/components/data-table';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { notifySuccess } from '@/ui/components/toast/notifications';

const STORAGE_KEY = 'update-schedules-list';
const settingsStore = createStore(STORAGE_KEY);

export function UpdateSchedulesContent() {
  const tableState = useTableState(settingsStore, STORAGE_KEY);
  const listQuery = useList(true);
  const groupsQuery = useEdgeGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((group) => [group.Id, group.Name])),
  });
  const items = useMemo<DecoratedItem[]>(() => {
    if (!listQuery.data || !groupsQuery.data) return [];
    return listQuery.data.map((item) => ({
      ...item,
      edgeGroupNames: item.edgeGroupIds
        .map((id) => groupsQuery.data[id])
        .filter((name): name is string => Boolean(name)),
    }));
  }, [groupsQuery.data, listQuery.data]);

  if (!listQuery.data || !groupsQuery.data) return null;

  return (
    <>
      <BetaAlert
        className="mb-2 ml-[15px]"
        message="Beta feature - currently limited to standalone Linux edge devices."
      />
      <Datatable
        dataset={items}
        columns={columns}
        settingsManager={tableState}
        title="Update & rollback"
        titleIcon={Clock}
        isLoading={listQuery.isLoading}
        renderTableActions={(selectedRows) => (
          <UpdateScheduleActions selectedRows={selectedRows} />
        )}
        isRowSelectable={(row) => row.original.status === StatusType.Pending}
        data-cy="environment-update-schedules-datatable"
      />
    </>
  );
}

function UpdateScheduleActions({
  selectedRows,
}: {
  selectedRows: EdgeUpdateSchedule[];
}) {
  const removeSchedules = useRemoveMutation();
  return (
    <>
      <DeleteButton
        onConfirmed={() =>
          removeSchedules.mutate(selectedRows, {
            onSuccess: () =>
              notifySuccess('Success', 'Schedules successfully removed'),
          })
        }
        disabled={selectedRows.length === 0}
        data-cy="remove-update-schedules-button"
        confirmMessage="Are you sure you want to remove these schedules?"
      />
      <AddButton
        to="/update-schedules/new"
        data-cy="add-update-schedules-button"
      >
        Add update & rollback schedule
      </AddButton>
    </>
  );
}
