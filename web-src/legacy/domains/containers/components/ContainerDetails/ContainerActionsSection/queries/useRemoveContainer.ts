import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { removeContainer } from '../../../../containers.service';
import { ContainerId } from '../../../../types';

import { queryKeys as containerQueryKeys } from './query-keys';

interface RemoveContainerParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  removeVolumes?: boolean;
}

export function useRemoveContainer() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      nodeName,
      removeVolumes,
    }: RemoveContainerParams) =>
      removeContainer(environmentId, containerId, { nodeName, removeVolumes }),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: containerQueryKeys.list(variables.environmentId),
      });
      router.push(buildHref('..', {}, pathname));
    },
    ...withError('Unable to remove container'),
  });
}
