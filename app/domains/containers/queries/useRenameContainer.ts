import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { ContainerId } from '@/domains/containers/types';
import { renameContainer } from '@/domains/containers/containers.service';
import { withError } from '@/core/query/query-client';

export function useRenameContainer() {
  return useMutation({
    mutationFn: ({
      containerId,
      environmentId,
      name,
      nodeName,
    }: {
      containerId: ContainerId;
      environmentId: EnvironmentId;
      name: string;
      nodeName?: string;
    }) => renameContainer(environmentId, containerId, name, { nodeName }),

    ...withError('Failed to rename container'),
  });
}
