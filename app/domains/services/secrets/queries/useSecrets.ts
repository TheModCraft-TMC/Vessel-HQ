import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export function getSecrets(environmentId: EnvironmentId) {
  return dockerClient.listSecrets(environmentId);
}

export function getSecret(environmentId: EnvironmentId, id: string) {
  return dockerClient.inspectSecret(environmentId, id);
}

export function createSecret(
  environmentId: EnvironmentId,
  spec: Parameters<typeof dockerClient.createSecret>[1]
) {
  return dockerClient.createSecret(environmentId, spec);
}

export function removeSecret(environmentId: EnvironmentId, id: string) {
  return dockerClient.removeSecret(environmentId, id);
}
