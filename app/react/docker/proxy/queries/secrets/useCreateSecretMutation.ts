import { SecretSpec } from '@/providers/infrastructure/docker';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

export async function createSecret(
  environmentId: EnvironmentId,
  secret: SecretSpec
) {
  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'secrets', 'create'),
      secret
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create secret');
  }
}
