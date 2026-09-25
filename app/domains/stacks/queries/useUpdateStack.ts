import { useMutation } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { buildStackUrl } from '@/domains/stacks/queries/common/buildUrl';
import { Stack } from '@/domains/stacks/models/types';
import { Registry } from '@/domains/registries';
import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';

export function useUpdateStackMutation() {
  return useMutation({
    mutationFn: updateStack,
  });
}

type Payload = {
  stackFileContent: string;
  env?: EnvVarValues | null;
  prune?: boolean;
  webhook?: string;
  repullImageAndRedeploy?: boolean;
  rollbackTo?: number;
  registries?: Array<Registry['Id']>;
};

type UpdateStackParams = {
  stackId: number;
  environmentId: number;
  payload: Payload;
};

export async function updateStack({
  stackId,
  environmentId,
  payload,
}: UpdateStackParams): Promise<Stack> {
  return axios.put(buildStackUrl(stackId), payload, {
    params: { endpointId: environmentId },
  });
}
