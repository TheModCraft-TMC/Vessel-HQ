import { EnvironmentId } from '@/domains/environments';

import { dockerClient } from './dockerClient';

export async function ping(environmentId: EnvironmentId) {
  return dockerClient.ping(environmentId);
}
