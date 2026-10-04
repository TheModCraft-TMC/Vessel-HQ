import { Clock } from 'lucide-react';
import { useMemo } from 'react';
import _ from 'lodash';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';
import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { Datatable } from '@/ui/components/data-table';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { AddButton } from '@/ui/components/buttons';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

import { useList } from '../queries/list';
import { EdgeUpdateSchedule, StatusType } from '../types';
import { useRemoveMutation } from '../queries/useRemoveMutation';
import { BetaAlert } from '../common/BetaAlert';

import { columns } from './columns';
import { createStore } from './datatable-store';
import { DecoratedItem } from './types';

const storageKey = 'update-schedules-list';
const settingsStore = createStore(storageKey);

export default withLimitToBE(ListView);

export function ListView() {
  const tableState = useTableState(settingsStore, storageKey);

  const listQuery = useList(true);
  const groupsQuery = useEdgeGroups({
    select: (groups) => Object.fromEntries(groups.map((g) => [g.Id, g.Name])),
  });

  const items: Array<DecoratedItem> = useMemo(() => {
    if (!listQuery.data || !groupsQuery.data) {
      return [];
    }

    return listQuery.data.map((item) => ({
      ...item,
      edgeGroupNames: _.compact(
        item.edgeGroupIds.map((id) => groupsQuery.data[id])
      ),
    }));
  }, [listQuery.data, groupsQuery.data]);

  if (!listQuery.data || !groupsQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs="Update and rollback"
        reload
      />

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
          <TableActions selectedRows={selectedRows} />
        )}
        isRowSelectable={(row) => row.original.status === StatusType.Pending}
        data-cy="environment-update-schedules-datatable"
      />
    </>
  );
}

function TableActions({
  selectedRows,
}: {
  selectedRows: EdgeUpdateSchedule[];
}) {
  const removeMutation = useRemoveMutation();
  return (
    <>
      <DeleteButton
        onConfirmed={() => handleRemove()}
        disabled={selectedRows.length === 0}
        data-cy="remove-update-schedules-button"
        confirmMessage="Are you sure you want to remove these schedules?"
      />
      <AddButton to="./new" data-cy="add-update-schedules-button">
        Add update & rollback schedule
      </AddButton>
    </>
  );

  async function handleRemove() {
    removeMutation.mutate(selectedRows, {
      onSuccess: () => {
        notifySuccess('Success', 'Schedules successfully removed');
      },
    });
  }
}
