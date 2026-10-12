import { useMutation, useQueryClient } from '@tanstack/react-query';
import { drainNode as drainNodeApi } from '@api/sdk.gen';

import { EnvironmentId } from '@/domains/environments';
import { withInvalidate, withError } from '@/core/query';

import { DrainOptions } from '../models/nodeForm';

import { queryKeys } from './query-keys';

const applicationQueryKeys = {
  applications: (
    environmentId: EnvironmentId,
    params?: { namespace?: string; nodeName?: string }
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      params,
    ] as const,
};

export function useDrainNodeMutation(
  environmentId: EnvironmentId,
  nodeName: string
) {
  const queryClient = useQueryClient();

  return useMutation(
    (drainOptions: DrainOptions) =>
      drainNode(environmentId, nodeName, drainOptions),
    {
      ...withInvalidate(queryClient, [
        queryKeys.nodes(environmentId),
        queryKeys.node(environmentId, nodeName),
        // invalidate apps, since drain can evict pods
        applicationQueryKeys.applications(environmentId),
      ]),
      ...withError('Unable to drain node'),
    }
  );
}

async function drainNode(
  environmentId: EnvironmentId,
  nodeName: string,
  drainOptions: DrainOptions
) {
  await drainNodeApi({
    path: { id: environmentId, name: nodeName },
    body: {
      Force: drainOptions.force,
      TimeoutSeconds: drainOptions.timeoutSeconds,
      GracePeriodSeconds: drainOptions.gracePeriodSeconds,
      IgnoreDaemonSets: drainOptions.ignoreDaemonSets,
      DeleteEmptyDirData: drainOptions.deleteEmptyDirData,
      DisableEviction: drainOptions.disableEviction,
    },
  });
}
