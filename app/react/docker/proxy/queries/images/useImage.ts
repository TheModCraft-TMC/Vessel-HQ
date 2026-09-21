import { ImageInspect } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';
import { withAgentTargetHeader } from '../utils';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getImage(
  environmentId: EnvironmentId,
  id: Required<ImageInspect['Id']>,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get<ImageInspect>(
      buildDockerProxyUrl(environmentId, 'images', id, 'json'),
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve image');
  }
}
