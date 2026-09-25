import {
  Volume as DockerVolume,
  VolumeCreateOptions,
} from '@/providers/infrastructure/docker';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';

export type VolumeConfiguration = VolumeCreateOptions;

export async function createVolume(
  environmentId: EnvironmentId,
  volume: VolumeConfiguration,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
  const { data } = await axios.post<DockerVolume>(
      buildDockerProxyUrl(environmentId, 'volumes', 'create'),
      volume,
      {
        headers: {
          'X-Portainer-VolumeName': volume.Name || '',
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
