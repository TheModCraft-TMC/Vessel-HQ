import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { Stack, StackType } from '@/domains/stacks/models/types';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import { getStacks } from '@/domains/stacks/queries/common/useStacks';
import { useDeleteStackMutation } from '@/domains/stacks/queries/common/useDeleteStackMutation';
import { getContainers } from '@/domains/containers';
import { getInfo } from '@/domains/stacks/hooks/useDockerEnvironment';
import { getSwarm } from '@/domains/stacks/hooks/useDockerEnvironment';
import { getServices } from '@/domains/services';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

import { ExternalStackViewModel } from '../../models/view-models/external-stack';
import { StackViewModel } from '../../models/view-models/stack';

import { StacksDatatable } from './StacksDatatable';
import { DecoratedStack } from './StacksDatatable/types';

export function ListView() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin, isLoading: isAdminLoading } = useIsEdgeAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteStackMutation();
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

  useEffect(() => {
    if (!environmentQuery.isLoading && !isAdminLoading && !canManageStacks) {
      router.stateService.go('docker.dashboard');
    }
  }, [
    canManageStacks,
    environmentQuery.isLoading,
    isAdminLoading,
    router.stateService,
  ]);

  if (!canManageStacks) {
    return null;
  }

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

  async function handleRemove(items: DecoratedStack[]) {
    await processItemsInBatches(items, async (stack) => {
      await deleteMutation.mutateAsync({
        id: typeof stack.Id === 'number' ? stack.Id : undefined,
        name: stack.Name,
        external: stack.External,
        environmentId,
      });
      notifySuccess('Stack successfully removed', stack.Name);
    });
    await queryClient.invalidateQueries(queryKeys.base());
  }
}

async function loadStacks(environmentId: number, includeOrphaned: boolean) {
  const info = await getInfo(environmentId);
  const composePromise = getStacks({
    EndpointID: environmentId,
    IncludeOrphanedStacks: includeOrphaned,
  });
  const containersPromise = getContainers(environmentId);
  const isSwarmManager = Boolean(
    info.Swarm?.NodeID && info.Swarm.ControlAvailable
  );
  const swarm = isSwarmManager ? await getSwarm(environmentId) : undefined;
  const swarmPromise = swarm?.ID
    ? getStacks({
        SwarmID: swarm.ID,
        IncludeOrphanedStacks: includeOrphaned,
      })
    : Promise.resolve([]);
  const servicesPromise = isSwarmManager
    ? getServices(environmentId)
    : Promise.resolve([]);
  const [composeStacks, swarmStacks, containers, services] = await Promise.all([
    composePromise,
    swarmPromise,
    containersPromise,
    servicesPromise,
  ]);

  const managed = [...composeStacks, ...swarmStacks]
    .filter(uniqueStack)
    .map(
      (stack) => new StackViewModel(stack, stack.EndpointId !== environmentId)
    );
  const external = [
    ...externalFromLabels(
      containers,
      'com.docker.compose.project',
      StackType.DockerCompose
    ),
    ...externalFromLabels(
      services,
      'com.docker.stack.namespace',
      StackType.DockerSwarm
    ),
  ];

  const managedWithRuntimeState = managed.map((stack) => ({
    ...stack,
    OrphanedRunning:
      stack.Orphaned && external.some((item) => item.Name === stack.Name),
  }));

  return [
    ...managedWithRuntimeState,
    ...external.filter(
      (item) =>
        !managedWithRuntimeState.some((stack) => stack.Name === item.Name)
    ),
  ];
}

function uniqueStack(stack: Stack, index: number, stacks: Stack[]) {
  return stacks.findIndex((item) => item.Id === stack.Id) === index;
}

function externalFromLabels(
  items: ExternalResource[],
  label: string,
  type: StackType
) {
  const external = new Map<string, ExternalStackViewModel>();
  items.forEach((item) => {
    const labels = item.Spec?.Labels || item.Labels;
    const created = item.Created
      ? item.Created
      : Math.floor(new Date(item.CreatedAt || 0).getTime() / 1000);
    const name = labels?.[label];
    if (name && !external.has(name)) {
      external.set(name, new ExternalStackViewModel(name, type, created));
    }
  });
  return [...external.values()];
}

interface ExternalResource {
  Labels?: Record<string, string>;
  Created?: number;
  Spec?: { Labels?: Record<string, string> };
  CreatedAt?: string;
}
