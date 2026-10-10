'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { StackContainersDatatable } from '@/domains/stacks/views/ItemView/StackContainersDatatable';
import { StackDetails } from '@/domains/stacks/views/ItemView/StackDetails';
import { StackServicesDatatable } from '@/domains/stacks/views/ItemView/StackServicesDatatable';
import { useUpdateStackResourcesOnDeployment } from '@/domains/stacks/views/ItemView/useUpdateStackResourcesOnDeployment';
import { useStack } from '@/domains/stacks/queries/common/useStack';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import { Stack, StackType } from '@/domains/stacks/models/types';
import { AccessControlPanel } from '@/react/portainer/access-control';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { notifyError } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const {
    isExternal,
    isOrphaned,
    isOrphanedRunning,
    isRegular,
    stackName,
    stackId,
    stackType,
  } = useStackRouteParams();
  const queryClient = useQueryClient();
  const stackQuery = useStack(stackId, {
    enabled: isRegular || isOrphaned,
  });
  const stack = stackQuery.data;

  useUpdateStackResourcesOnDeployment(stack);

  const resourceControl = useMemo(
    () =>
      stack?.ResourceControl
        ? new ResourceControlViewModel(stack.ResourceControl)
        : undefined,
    [stack]
  );
  const handleAccessUpdate = useCallback(
    () => queryClient.invalidateQueries(queryKeys.stack(stackId)),
    [queryClient, stackId]
  );

  useEffect(() => {
    if (
      isInvalidStackType({
        isExternal,
        isOrphaned,
        isOrphanedRunning,
        stackType,
      })
    ) {
      notifyError('Failure', undefined, 'Invalid type URL parameter.');
    }
  }, [isExternal, isOrphaned, isOrphanedRunning, stackType]);

  return (
    <>
      <PageHeader
        title="Stack details"
        breadcrumbs={[
          { label: 'Stacks', link: '/:endpointId/docker/stacks' },
          stackName,
        ]}
      />
      <>
        <StackDetails
          isExternal={isExternal}
          isOrphaned={isOrphaned}
          isOrphanedRunning={isOrphanedRunning}
          isRegular={isRegular}
          stackName={stackName}
          stack={stack}
        />
        <div className="space-y-4">
          {(!isOrphaned || isOrphanedRunning) && (
            <>
              {stackType === StackType.DockerCompose && (
                <StackContainersDatatable stackName={stackName} />
              )}
              {stackType === StackType.DockerSwarm && (
                <StackServicesDatatable name={stackName} />
              )}
            </>
          )}
          {stack && !isOrphaned && (
            <AccessControlPanel
              environmentId={stack.EndpointId}
              resourceId={`${stack.EndpointId}_${stack.Name}`}
              resourceControl={resourceControl}
              resourceType={ResourceControlType.Stack}
              disableOwnershipChange={stack.ReadOnly}
              onUpdateSuccess={handleAccessUpdate}
            />
          )}
        </div>
      </>
    </>
  );
}

function isInvalidStackType({
  isExternal,
  isOrphaned,
  isOrphanedRunning,
  stackType,
}: {
  isExternal: boolean;
  isOrphaned: boolean;
  isOrphanedRunning: boolean;
  stackType: StackType | undefined;
}) {
  return (
    (isExternal || (isOrphaned && isOrphanedRunning)) &&
    (!stackType ||
      (stackType !== StackType.DockerSwarm &&
        stackType !== StackType.DockerCompose))
  );
}

function useStackRouteParams() {
  const params = useRouteParams();
  const isRegular = params.regular === 'true';
  const isExternal = params.external === 'true';
  const isOrphaned = params.orphaned === 'true';
  const isOrphanedRunning = params.orphanedRunning === 'true';
  const stackName = params.name || ('' as string);
  const stackId = params.id
    ? (parseInt(params.id, 10) as Stack['Id'])
    : undefined;
  const stackType = ['1', '2', '3'].includes(params.type)
    ? (parseInt(params.type, 10) as StackType)
    : undefined;

  return {
    isExternal,
    isRegular,
    isOrphaned,
    isOrphanedRunning,
    stackName,
    stackId,
    stackType,
  };
}
