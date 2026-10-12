import { Node } from '@/providers/infrastructure/docker';
import axios, { parseAxiosError } from '@/shared/http';
import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getNode(
  environmentId: EnvironmentId,
  id: NonNullable<Node['ID']>
) {
  try {
    const { data } = await axios.get<Node>(
      buildDockerProxyUrl(environmentId, 'nodes', id)
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve node');
  }
}
