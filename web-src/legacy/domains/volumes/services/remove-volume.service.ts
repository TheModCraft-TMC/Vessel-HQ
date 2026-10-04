import { Volume } from '@/providers/infrastructure/docker';
import { EnvironmentId } from '@/domains/environments';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';

export async function removeVolume(
  environmentId: EnvironmentId,
  name: Volume['Name'],
  { nodeName }: { nodeName: string }
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'volumes', name), {
      headers: {
        ...withAgentTargetHeader(nodeName),
      },
    });
  } catch (e) {
    throw parseAxiosError(e, 'Unable to remove volume');
  }
}
