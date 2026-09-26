import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

export async function getSecrets(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'secrets')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve secrets');
  }
}
