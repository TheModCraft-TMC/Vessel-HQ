import { DockerPortainerResponse, Secret } from '@/providers/infrastructure/docker';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

export async function getSecret(
  environmentId: EnvironmentId,
  id: NonNullable<Secret['ID']>
) {
  try {
    const { data } = await axios.get<DockerPortainerResponse<Secret>>(
      buildDockerProxyUrl(environmentId, 'secrets', id)
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve secret');
  }
}
