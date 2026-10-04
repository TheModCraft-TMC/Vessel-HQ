import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { AutoUpdateResponse } from '@/domains/gitops';
import { buildUrl } from '@/domains/edge/queries/edge-stacks/buildUrl';
import { DeploymentType, EdgeStack } from '@/domains/edge/models/edge-stack';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { Registry } from '@/domains/registries';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';

export interface UpdateEdgeStackGitPayload {
  id: EdgeStack['Id'];
  autoUpdate: AutoUpdateResponse | null;
  refName: string;
  groupIds: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  updateVersion: boolean;
  registries?: Array<Registry['Id']>;
}

export function useUpdateEdgeStackGitMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateEdgeStackGit,
    mutationOptions(
      withError('Failed updating stack'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function updateEdgeStackGit({
  id,
  ...payload
}: UpdateEdgeStackGitPayload) {
  try {
    await axios.put(buildUrl(id, 'git'), payload);
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed updating stack');
  }
}
