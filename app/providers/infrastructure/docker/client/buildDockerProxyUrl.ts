import { compact } from 'lodash';

import { EnvironmentId } from '@/domains/environments';

/**
 * Builds the Portainer proxy URL for a Docker Engine operation.
 * Undefined and otherwise empty path segments are omitted for compatibility
 * with the legacy Docker query helpers.
 */
export function buildDockerProxyUrl(
  environmentId: EnvironmentId,
  action: string,
  ...subSegments: unknown[]
) {
  let url = `/endpoints/${environmentId}/docker/${action}`;
  const joined = compact(subSegments).join('/');

  if (joined) {
    url += `/${joined}`;
  }

  return url;
}
