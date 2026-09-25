import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { pauseContainer } from '../../../../containers.service';
import { ContainerId } from '../../../../types';

import { queryKeys as containerQueryKeys } from './query-keys';

interface ContainerActionParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
}

export function usePauseContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      nodeName,
    }: ContainerActionParams) =>
      pauseContainer(environmentId, containerId, { nodeName }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
    },
    ...withError('Unable to pause container'),
  });
}
