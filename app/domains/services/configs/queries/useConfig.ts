import { Config } from '@/providers/infrastructure/docker';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';

export async function getConfig(
  environmentId: EnvironmentId,
  configId: Config['ID']
) {
  return dockerClient.inspectConfig(environmentId, configId ?? '');
}
