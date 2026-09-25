import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export function useDeleteConfigMutation() {
  return useMutation({
    mutationFn: deleteConfig,
  });
}

export async function deleteConfig({
  environmentId,
  configId,
}: {
  environmentId: EnvironmentId;
  configId: string;
}) {
  return dockerClient.removeConfig(environmentId, configId);
}
