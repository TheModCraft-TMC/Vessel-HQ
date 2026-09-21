import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export async function ping(environmentId: EnvironmentId) {
  try {
    await axios.get(buildDockerProxyUrl(environmentId, '_ping'));
  } catch (error) {
    throw parseAxiosError(error);
  }
}
