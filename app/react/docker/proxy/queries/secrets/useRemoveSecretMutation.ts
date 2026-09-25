import { Secret } from '@/providers/infrastructure/docker';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

export async function removeSecret(
  environmentId: EnvironmentId,
  id: NonNullable<Secret['ID']>
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'secrets', id));
  } catch (err) {
    throw parseAxiosError(err, 'Unable to remove secret');
  }
}
