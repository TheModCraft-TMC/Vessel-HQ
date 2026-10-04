import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { mutationOptions, withError, withInvalidate } from '@/core/query';

import { ServiceUpdateConfig } from '../types';

import { queryKeys } from './query-keys';

export function useCreateServiceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    createService,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.list(environmentId)]),
      withError('Unable to create service')
    )
  );
}

export async function createService({
  environmentId,
  config,
  registryId,
}: {
  environmentId: EnvironmentId;
  config: ServiceUpdateConfig;
  registryId?: number;
}) {
  return dockerClient.createService(environmentId, config, { registryId });
}
