import { Secret } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

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
