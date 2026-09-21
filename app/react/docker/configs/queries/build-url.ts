import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';

export function buildUrl(environmentId: EnvironmentId, id = '', action = '') {
  return buildDockerProxyUrl(environmentId, 'configs', id, action);
}
