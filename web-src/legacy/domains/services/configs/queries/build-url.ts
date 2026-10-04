import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

export function buildUrl(environmentId: EnvironmentId, id = '', action = '') {
  return buildDockerProxyUrl(environmentId, 'configs', id, action);
}
