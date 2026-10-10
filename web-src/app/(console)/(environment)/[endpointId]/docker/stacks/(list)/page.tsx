'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { withError } from '@/core/query';
import { DecoratedStack } from '@/domains/stacks/views/ListView/StacksDatatable/types';
import { loadStacks } from '@/domains/stacks/views/ListView/ListView';
import { StacksDatatable } from '@/domains/stacks/views/ListView/StacksDatatable';
import { useDeleteStackMutation } from '@/domains/stacks/queries/common/useDeleteStackMutation';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin, isLoading: isAdminLoading } = useIsEdgeAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteStack = useDeleteStackMutation();
  const stacksQuery = useQuery(
    [...queryKeys.base(), environmentId, 'docker-list', isAdmin],
    () => loadStacks(environmentId, isAdmin),
    { enabled: !isAdminLoading, ...withError('Unable to retrieve stacks') }
  );
  const canManageStacks =
    isAdmin ||
    Boolean(
      environmentQuery.data?.SecuritySettings
        .allowStackManagementForRegularUsers
    );
  const handleRemove = useCallback(
    async (stacks: DecoratedStack[]) => {
      await processItemsInBatches(stacks, async (stack) => {
        await deleteStack.mutateAsync({
          id: typeof stack.Id === 'number' ? stack.Id : undefined,
          name: stack.Name,
          external: stack.External,
          environmentId,
        });
        notifySuccess('Stack successfully removed', stack.Name);
      });
      await queryClient.invalidateQueries(queryKeys.base());
    },
    [deleteStack, environmentId, queryClient]
  );

  useEffect(() => {
    if (!environmentQuery.isLoading && !isAdminLoading && !canManageStacks) {
      router.push(`/${environmentId}/docker/dashboard`);
    }
  }, [
    canManageStacks,
    environmentId,
    environmentQuery.isLoading,
    isAdminLoading,
    router,
  ]);

  if (!canManageStacks) return null;

  return (
    <>
      <PageHeader title="Stacks list" breadcrumbs="Stacks" reload />
      <StacksDatatable
        dataset={stacksQuery.data || []}
        isImageNotificationEnabled={
          environmentQuery.data?.EnableImageNotification || false
        }
        onRemove={handleRemove}
      />
    </>
  );
}
