import { Volume } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';

/**
 * Raw docker API query
 * @param environmentId
 * @param name
 * @returns
 */
export async function getVolume(
  environmentId: EnvironmentId,
  name: Volume['Name'],
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'volumes', name),
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve volume details');
  }
}
