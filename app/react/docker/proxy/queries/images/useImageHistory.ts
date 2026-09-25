import { EnvironmentId } from '@/domains/environments';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';
import { withAgentTargetHeader } from '../utils';

export type ImageLayer = {
  Id: string;
  Created: number;
  CreatedBy: string;
  Tags: string[];
  Size: number;
  Comment: string;
};

/**
 * Raw docker API proxy
 * @param environmentId
 * @returns
 */
export async function getImageHistory(
  environmentId: EnvironmentId,
  id: ImageLayer['Id'],
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get<ImageLayer[]>(
      buildDockerProxyUrl(environmentId, 'images', id, 'history'),
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve image layers');
  }
}
