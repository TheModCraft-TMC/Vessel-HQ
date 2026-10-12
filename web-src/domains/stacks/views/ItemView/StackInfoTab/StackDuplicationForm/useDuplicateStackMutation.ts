import { useMutation } from '@tanstack/react-query';

import { getSwarm } from '@/domains/stacks/hooks/useDockerEnvironment';
import { Pair } from '@/domains/settings';
import { EnvironmentId } from '@/domains/environments';
import { createStandaloneStackFromFileContent } from '@/domains/stacks/queries/common/useCreateStack/createStandaloneStackFromFileContent';
import { createSwarmStackFromFileContent } from '@/domains/stacks/queries/common/useCreateStack/createSwarmStackFromFileContent';
import { StackType } from '@/domains/stacks/models/types';

export function useDuplicateStackMutation() {
  return useMutation({
    mutationFn: duplicateStack,
  });
}

export async function duplicateStack({
  name,
  fileContent,
  targetEnvironmentId,
  type,
  env,
}: {
  name: string;
  fileContent: string;
  targetEnvironmentId: EnvironmentId;
  type: StackType;
  env?: Array<Pair> | null;
}) {
  if (type === StackType.DockerSwarm) {
    const swarm = await getSwarm(targetEnvironmentId);

    if (!swarm.ID) {
      throw new Error('Swarm ID is required to duplicate a Swarm stack');
    }

    return createSwarmStackFromFileContent({
      environmentId: targetEnvironmentId,
      name,
      stackFileContent: fileContent,
      swarmID: swarm.ID,
      env,
    });
  }
  return createStandaloneStackFromFileContent({
    environmentId: targetEnvironmentId,
    name,
    stackFileContent: fileContent,
    env,
  });
}
