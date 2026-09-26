import { Node, NodeSpec } from '@/providers/infrastructure/docker';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @param node
 * @param version
 */
export async function updateNode(
  environmentId: EnvironmentId,
  id: NonNullable<Node['ID']>,
  node: NodeSpec,
  version: number
) {
  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'nodes', id, 'update'),
      node,
      { params: { version } }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to update node');
  }
}
