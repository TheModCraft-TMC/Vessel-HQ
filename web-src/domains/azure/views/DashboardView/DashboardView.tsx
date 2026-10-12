import { Package } from 'lucide-react';
import { PageContent } from '@console/layout/PageContent';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import Subscription from '@/shared/assets/ico/subscription.svg?c';
import { PageHeader } from '@/ui/layouts/view-layout';
import { DashboardItem } from '@/ui/components/DashboardItem';
import { DashboardGrid } from '@/ui/components/DashboardItem/DashboardGrid';

import { useResourceGroups } from '../../queries/useResourceGroups';
import { useSubscriptions } from '../../queries/useSubscriptions';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);

  const resourceGroupsQuery = useResourceGroups(
    environmentId,
    subscriptionsQuery.data
  );

  const subscriptionsCount = subscriptionsQuery.data?.length;
  const resourceGroupsCount = Object.values(
    resourceGroupsQuery.resourceGroups
  ).flatMap((x) => Object.values(x)).length;

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} reload />

      <PageContent>
        {subscriptionsQuery.data && (
          <DashboardGrid>
            <DashboardItem
              value={subscriptionsCount as number}
              data-cy="subscriptions-count"
              isLoading={subscriptionsQuery.isLoading}
              isRefetching={subscriptionsQuery.isRefetching}
              icon={Subscription}
              type="Subscription"
            />
            {!resourceGroupsQuery.isError && !resourceGroupsQuery.isLoading && (
              <DashboardItem
                value={resourceGroupsCount}
                data-cy="resource-groups-count"
                isLoading={resourceGroupsQuery.isLoading}
                icon={Package}
                type="Resource group"
              />
            )}
          </DashboardGrid>
        )}
      </PageContent>
    </>
  );
}
