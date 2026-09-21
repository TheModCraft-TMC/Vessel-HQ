import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';
import { EnvironmentId } from '@/domains/environments';

export function buildUrl(
  environmentId: EnvironmentId,
  { action, id }: { id?: string; action?: string } = {}
) {
  let url = buildDockerProxyUrl(environmentId, 'volumes');

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
