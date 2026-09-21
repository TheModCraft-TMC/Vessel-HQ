import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import { EnvironmentId } from '@/domains/environments';

import { restartContainer } from '../../../containers.service';
import { ContainerId } from '../../../types';
import { queryKeys as containerQueryKeys } from '../../../queries/query-keys';

interface ContainerActionParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
}

export function useRestartContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      nodeName,
    }: ContainerActionParams) =>
      restartContainer(environmentId, containerId, { nodeName }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
    },
    ...withError('Unable to restart container'),
  });
}
