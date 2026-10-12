import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { recreateContainer } from '../../../../containers.service';
import { ContainerId } from '../../../../types';

import { queryKeys as containerQueryKeys } from './query-keys';

interface RecreateContainerParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  pullImage: boolean;
  nodeName?: string;
}

export function useRecreateContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      pullImage,
      nodeName,
    }: RecreateContainerParams) =>
      recreateContainer(environmentId, containerId, pullImage, { nodeName }),
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
    },
    ...withError('Unable to re-create container'),
  });
}
