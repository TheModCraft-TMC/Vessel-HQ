import { ConfigSpec } from '@/providers/infrastructure/docker';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';

export async function createConfig(
  environmentId: EnvironmentId,
  config: ConfigSpec
) {
  return dockerClient.createConfig(environmentId, config);
}
