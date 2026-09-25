import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { resumeContainer } from '../../../../containers.service';
import { ContainerId } from '../../../../types';

import { queryKeys as containerQueryKeys } from './query-keys';

interface ContainerActionParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
}

export function useResumeContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      nodeName,
    }: ContainerActionParams) =>
      resumeContainer(environmentId, containerId, { nodeName }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
    },
    ...withError('Unable to resume container'),
  });
}
