import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { toNetwork } from '../mappers/network';
import { NetworkId } from '../models/network';

import { queryKeys } from './queryKeys';

export function useNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  return useQuery(
    [...queryKeys.item(environmentId, networkId), { nodeName }],
    () => getNetwork(environmentId, networkId, { nodeName }),
    {
      ...withError('Unable to get network'),
    }
  );
}

/**
 */
export async function getNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient
    .inspectNetwork(environmentId, networkId, { nodeName })
    .then(toNetwork);
}
