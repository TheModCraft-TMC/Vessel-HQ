import { Node } from 'docker-types';
import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

import { queryKeys } from './query-keys';

export function useNodes(
  environmentId: EnvironmentId,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.base(environmentId),
    () => getNodes(environmentId),
    { enabled }
  );
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @returns
 */
export async function getNodes(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Node>>(
      buildDockerProxyUrl(environmentId, 'nodes')
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve nodes');
  }
}
