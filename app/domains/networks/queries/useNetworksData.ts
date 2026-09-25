import _ from 'lodash';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { NetworkViewModel } from '@/domains/networks/models/network-view-model';
import {
  useAgentNodes,
  AgentNode,
} from '@/react/docker/agent/queries/useAgentNodes';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';

import { getIPv4Configs, getIPv6Configs } from '../models/network-helper';
import { DecoratedNetwork } from '../components/NetworkList/types';

import { useNetworks } from './useNetworks';


export function useNetworksData(autoRefreshRate?: number) {
  const environmentId = useEnvironmentId();

  const networksQuery = useNetworks(
    environmentId,
    {
      local: true,
      swarm: true,
      swarmAttachable: true,
    },
    {
      select: (networks) =>
        networks.map((n) => {
          const network = new NetworkViewModel(n);
          const ipam: NetworkViewModel['IPAM'] & {
            IPV4Configs?: Array<NetworkViewModel['IPAM']['Config'][number]>;
            IPV6Configs?: Array<NetworkViewModel['IPAM']['Config'][number]>;
          } = network.IPAM ?? {};

          ipam.IPV4Configs = getIPv4Configs(ipam.Config);
          ipam.IPV6Configs = getIPv6Configs(ipam.Config);

          network.IPAM = ipam;
          return {
            ...network,
            IPAM: ipam,
            Subs: [],
          } satisfies DecoratedNetwork;
        }),
      autoRefreshRate,
    }
  );
  const isSwarmAgent = useIsSwarmAgent();
  const apiVersionQuery = useApiVersion(environmentId, {
    enabled: isSwarmAgent,
  });
  const agentsQuery = useAgentNodes(environmentId, apiVersionQuery.data || 1, {
    enabled: isSwarmAgent,
  });

  if (!networksQuery.data) {
    return { isLoading: networksQuery.isLoading };
  }

  const networks = groupSwarmNetworksManagerNodesFirst(
    networksQuery.data,
    agentsQuery.data
  );

  return {
    data: networks,
    isLoading: networksQuery.isLoading,
  };
}

export function groupSwarmNetworksManagerNodesFirst(
  networks: Array<DecoratedNetwork>,
  agents: Array<AgentNode> = []
): Array<DecoratedNetwork> {
  const nonSwarmNetworks = networks.filter((item) => item.Scope !== 'swarm');
  const swarmNetworks = networks.filter((item) => item.Scope === 'swarm');

  const swarmNetworksById = new Map<string, Array<DecoratedNetwork>>();
  swarmNetworks.forEach((groupItem) => {
    const group = swarmNetworksById.get(groupItem.Id) ?? [];
    group.push(groupItem);
    swarmNetworksById.set(groupItem.Id, group);
  });

  const groupedSwarmNetworks = Array.from(swarmNetworksById.values()).map(
    (group) => {
      const [item, ...rest] = _.sortBy(group, getRole);
      return { ...item, Subs: rest };
    }
  );

  return [...groupedSwarmNetworks, ...nonSwarmNetworks];

  function getRole(item: NetworkViewModel) {
    return agents.find((agent) => agent.NodeName === item.NodeName)?.NodeRole;
  }
}
