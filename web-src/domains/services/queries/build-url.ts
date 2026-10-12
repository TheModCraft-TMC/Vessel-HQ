import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

import { ServiceId } from '../types';

export function buildUrl(
  endpointId: EnvironmentId,
  id?: ServiceId,
  action?: string
) {
  return buildDockerProxyUrl(endpointId, 'services', id, action);
}
