'use client';

import { Bell } from 'lucide-react';
import { useStore } from 'zustand';

import { columns } from '@/domains/notifications/columns';
import { useUser } from '@/react/hooks/useUser';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { ToastNotification } from '@/ui/components/toast/types';
import { notificationsStore } from '@/ui/components/toast/notifications-store';

const STORAGE_KEY = 'notifications-list';
const settingsStore = createPersistedStore(STORAGE_KEY, {
  id: 'time',
  desc: true,
});

export function NotificationsContent() {
  const { user } = useUser();
  const notifications =
    useStore(notificationsStore, (state) => state.userNotifications[user.Id]) ||
    [];
  const tableState = useTableState(settingsStore, STORAGE_KEY);

  return (
    <Datatable
      columns={columns}
      title="Notifications"
      titleIcon={Bell}
      dataset={notifications}
      settingsManager={tableState}
      renderTableActions={(selectedRows) => (
        <NotificationActions selectedRows={selectedRows} />
      )}
      getRowId={(notification) => notification.id}
      data-cy="notifications-datatable"
    />
  );
}

function NotificationActions({
  selectedRows,
}: {
  selectedRows: ToastNotification[];
}) {
  const { user } = useUser();
  const store = useStore(notificationsStore);

  return (
    <DeleteButton
      onConfirmed={() =>
        store.removeNotifications(
          user.Id,
          selectedRows.map((notification) => notification.id)
        )
      }
      disabled={selectedRows.length === 0}
      data-cy="remove-notifications-button"
      confirmMessage="Are you sure you want to remove the selected notifications?"
    />
  );
}
