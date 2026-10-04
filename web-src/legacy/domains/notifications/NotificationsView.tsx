import { useRouteParams } from '@console/console/routing/useRouteParams';
import { Bell } from 'lucide-react';
import { useStore } from 'zustand';

import { useUser } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { notificationsStore } from '@/ui/components/toast/notifications-store';
import { ToastNotification } from '@/ui/components/toast/types';

import { columns } from './columns';

const storageKey = 'notifications-list';
const settingsStore = createPersistedStore(storageKey, {
  id: 'time',
  desc: true,
});

export function NotificationsView() {
  const { user } = useUser();

  const userNotifications: ToastNotification[] =
    useStore(notificationsStore, (state) => state.userNotifications[user.Id]) ||
    [];

  const breadcrumbs = 'Notifications';
  const tableState = useTableState(settingsStore, storageKey);

  const { id: activeItemId } = useRouteParams();

  return (
    <>
      <PageHeader title="Notifications" breadcrumbs={breadcrumbs} reload />
      <Datatable
        columns={columns}
        title="Notifications"
        titleIcon={Bell}
        dataset={userNotifications}
        settingsManager={tableState}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        getRowId={(row) => row.id}
        highlightedItemId={activeItemId}
        data-cy="notifications-datatable"
      />
    </>
  );
}

function TableActions({ selectedRows }: { selectedRows: ToastNotification[] }) {
  const { user } = useUser();
  const notificationsStoreState = useStore(notificationsStore);
  return (
    <DeleteButton
      onConfirmed={() => handleRemove()}
      disabled={selectedRows.length === 0}
      data-cy="remove-notifications-button"
      confirmMessage="Are you sure you want to remove the selected notifications?"
    />
  );

  function handleRemove() {
    const { removeNotifications } = notificationsStoreState;
    const ids = selectedRows.map((row) => row.id);
    removeNotifications(user.Id, ids);
  }
}
