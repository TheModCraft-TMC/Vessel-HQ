import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';
import { withAgentTargetHeader } from '../utils';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param file
 * @returns
 */
export async function uploadImages(
  environmentId: EnvironmentId,
  file: File,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    return await axios.post(
      buildDockerProxyUrl(environmentId, 'images', 'load'),
      file,
      {
        headers: {
          'Content-Type': file.type, // 'application/x-tar',
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Unable to upload image');
  }
}
