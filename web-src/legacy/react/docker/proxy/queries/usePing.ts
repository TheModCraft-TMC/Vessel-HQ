import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export async function ping(environmentId: EnvironmentId) {
  return dockerClient.ping(environmentId);
}
