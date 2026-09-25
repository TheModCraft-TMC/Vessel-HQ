import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { buildUrl } from '@/domains/edge/queries/edge-stacks/buildUrl';
import {
  DeploymentType,
  EdgeStack,
  StaggerConfig,
} from '@/domains/edge/models/edge-stack';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { Registry } from '@/domains/registries';
import { Pair } from '@/domains/settings';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';

export interface UpdateEdgeStackPayload {
  id: EdgeStack['Id'];
  stackFileContent: string;
  edgeGroups: Array<EdgeGroup['Id']>;
  deploymentType: DeploymentType;
  registries: Array<Registry['Id']>;
  useManifestNamespaces: boolean;
  prePullImage?: boolean;
  rePullImage?: boolean;
  retryDeploy?: boolean;
  updateVersion: boolean;
  webhook?: string;
  envVars: Pair[];
  rollbackTo?: number;
  staggerConfig?: StaggerConfig;
}

export function useUpdateEdgeStackMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateEdgeStack,
    mutationOptions(
      withError('Failed updating stack'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function updateEdgeStack({ id, ...payload }: UpdateEdgeStackPayload) {
  try {
    await axios.put(buildUrl(id), payload);
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed updating stack');
  }
}
