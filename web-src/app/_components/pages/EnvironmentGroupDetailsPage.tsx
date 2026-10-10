'use client';

import { useMemo, useState } from 'react';
import { Box, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { GroupHeader } from '@/react/portainer/environments/environment-groups/ItemView/GroupHeader';
import { AccessTab } from '@/react/portainer/environments/environment-groups/ItemView/tabs/AccessTab';
import { EnvironmentsTab } from '@/react/portainer/environments/environment-groups/ItemView/tabs/EnvironmentsTab';
import { useDeleteEnvironmentGroupMutation } from '@/react/portainer/environments/environment-groups/queries/useDeleteEnvironmentGroupMutation';
import { useGroup } from '@/react/portainer/environments/environment-groups/queries/useGroup';
import { confirm } from '@/ui/components/dialog/confirm';
import { ModalType } from '@/ui/components/dialog/Modal';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

export function EnvironmentGroupDetailsHeader({
  groupId,
}: {
  groupId: number;
}) {
  const groupQuery = useGroup(groupId);

  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Groups', link: '/groups' },
        groupQuery.data?.Name ?? 'Environment group',
      ]}
    />
  );
}

export function EnvironmentGroupDetailsContent({
  groupId,
}: {
  groupId: number;
}) {
  const router = useRouter();
  const deleteGroup = useDeleteEnvironmentGroupMutation();
  const [addEnvironmentsOpen, setAddEnvironmentsOpen] = useState(false);
  const groupQuery = useGroup(
    deleteGroup.isLoading || deleteGroup.isSuccess ? undefined : groupId,
    { size: true }
  );
  const groupName = groupQuery.data?.Name ?? 'Environment group';
  const tabs = useMemo<Array<Tab>>(
    () => [
      {
        name: 'Environments',
        icon: Box,
        widget: (
          <EnvironmentsTab
            externalDrawerOpen={addEnvironmentsOpen}
            onExternalDrawerClose={() => setAddEnvironmentsOpen(false)}
          />
        ),
        selectedTabParam: 'environments',
      },
      {
        name: 'Access',
        icon: UsersRound,
        widget: <AccessTab />,
        selectedTabParam: 'access',
      },
    ],
    [addEnvironmentsOpen]
  );
  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <div className="mx-4 space-y-4">
        <GroupHeader
          group={groupQuery.data}
          isLoading={groupQuery.isLoading}
          onRefresh={() => groupQuery.refetch()}
          onAddEnvironments={() => setAddEnvironmentsOpen(true)}
          onDelete={handleDelete}
        />
        <WidgetTabs
          tabs={tabs}
          currentTabIndex={currentTabIndex}
          useContainer={false}
        />
      </div>
      {tabs[currentTabIndex].widget}
    </>
  );

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete Environment Group',
      modalType: ModalType.Destructive,
      message: `Are you sure you want to delete the environment group "${groupName}"? This action cannot be undone.`,
      confirmButton: buildConfirmButton('Delete', 'danger'),
    });

    if (!confirmed) return;
    deleteGroup.mutate(groupId, {
      onSuccess() {
        notifySuccess('Success', 'Environment group deleted');
        router.push('/groups');
      },
    });
  }
}
