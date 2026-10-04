import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { mutationOptions, withError, withInvalidate } from '@/core/query';

import { ServiceUpdateConfig } from '../types';

import { queryKeys } from './query-keys';

export function useUpdateServiceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    updateService,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.list(environmentId)]),
      withError('Unable to update service')
    )
  );
}

export async function updateService({
  environmentId,
  serviceId,
  config,
  rollback,
  version,
  registryId,
}: {
  environmentId: EnvironmentId;
  serviceId: string;
  config: ServiceUpdateConfig;
  rollback?: 'previous';
  version: number;
  registryId?: number;
}) {
  return dockerClient.updateService(environmentId, serviceId, config, version, {
    rollback,
    registryId,
  });
}
