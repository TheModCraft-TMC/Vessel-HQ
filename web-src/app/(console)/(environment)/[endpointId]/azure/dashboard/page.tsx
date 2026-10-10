'use client';

import { Package } from 'lucide-react';

import SubscriptionIcon from '@/assets/ico/subscription.svg?c';
import { useResourceGroups } from '@/domains/azure/queries/useResourceGroups';
import { useSubscriptions } from '@/domains/azure/queries/useSubscriptions';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

import { DashboardItem } from '@@/DashboardItem';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

export default function Page() {
  const environmentId = useEnvironmentId();
  const subscriptions = useSubscriptions(environmentId);
  const resourceGroups = useResourceGroups(environmentId, subscriptions.data);
  const resourceGroupCount = Object.values(
    resourceGroups.resourceGroups
  ).flatMap((groups) => Object.values(groups)).length;

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} reload />
      <div className="mx-4">
        {subscriptions.data && (
          <DashboardGrid>
            <DashboardItem
              value={subscriptions.data.length}
              data-cy="subscriptions-count"
              isLoading={subscriptions.isLoading}
              isRefetching={subscriptions.isRefetching}
              icon={SubscriptionIcon}
              type="Subscription"
            />
            {!resourceGroups.isError && !resourceGroups.isLoading && (
              <DashboardItem
                value={resourceGroupCount}
                data-cy="resource-groups-count"
                isLoading={resourceGroups.isLoading}
                icon={Package}
                type="Resource group"
              />
            )}
          </DashboardGrid>
        )}
      </div>
    </>
  );
}
