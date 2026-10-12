import { useQuery } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { toNetwork } from '../mappers/network';
import { DockerNetwork } from '../models/network';

import { queryKeys } from './queryKeys';
import { NetworksQuery } from './types';

export function useNetworks<T = Array<DockerNetwork>>(
  environmentId: EnvironmentId,
  query: NetworksQuery,
  {
    enabled = true,
    onSuccess,
    select,
    autoRefreshRate,
  }: {
    enabled?: boolean;
    onSuccess?(networks: T): void;
    select?(networks: Array<DockerNetwork>): T;
    autoRefreshRate?: number;
  } = {}
) {
  return useQuery(
    queryKeys.list(environmentId, query),
    () => getNetworks(environmentId, query),
    {
      enabled,
      onSuccess,
      select,
      refetchInterval: autoRefreshRate,
      ...withError('Unable to retrieve networks'),
    }
  );
}

export async function getNetworks(
  environmentId: EnvironmentId,
  { local, swarm, swarmAttachable, filters }: NetworksQuery
) {
  const networks = await dockerClient.listNetworks(environmentId, { filters });
  const parsed = networks.map(toNetwork);

  return !local && !swarm && !swarmAttachable
    ? parsed
    : parsed.filter(
        (network) =>
          (local && network.Scope === 'local') ||
          (swarm && network.Scope === 'swarm') ||
          (swarmAttachable &&
            network.Scope === 'swarm' &&
            network.Attachable === true)
      );
}
