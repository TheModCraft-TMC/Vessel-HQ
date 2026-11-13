import type { Edge } from '@xyflow/react';

import {
  createTopologyGraph,
  type StackNetworkTopology,
  type TopologyNode,
} from './topology';

export function workloadHealth(
  state?: string
): 'running' | 'attention' | 'unknown' {
  if (!state) return 'unknown';
  const value = state.toLowerCase();
  if (value === 'running' || value === 'healthy') return 'running';
  if (
    [
      'exited',
      'dead',
      'restarting',
      'paused',
      'unhealthy',
      'removing',
      'created',
    ].includes(value)
  )
    return 'attention';
  return 'unknown';
}

/** Filter resources without inventing attachments or losing matching network children. */
export function filterTopology(
  topology: StackNetworkTopology,
  search: string,
  attentionOnly: boolean
): StackNetworkTopology {
  const term = search.trim().toLowerCase();
  const matchingNetworks = new Set(
    topology.networks
      .filter((network) =>
        `${network.name} ${network.id} ${network.driver}`
          .toLowerCase()
          .includes(term)
      )
      .map((network) => network.id)
  );
  const workloads = topology.workloads.filter(
    (workload) =>
      (!attentionOnly || workloadHealth(workload.state) === 'attention') &&
      (!term ||
        `${workload.name} ${workload.id} ${workload.state || ''}`
          .toLowerCase()
          .includes(term) ||
        workload.networks.some((network) =>
          matchingNetworks.has(network.networkId)
        ))
  );
  const attached = new Set(
    workloads.flatMap((workload) =>
      workload.networks.map((network) => network.networkId)
    )
  );
  return {
    ...topology,
    workloads,
    networks: topology.networks.filter(
      (network) =>
        attached.has(network.id) ||
        (!attentionOnly && (!term || matchingNetworks.has(network.id)))
    ),
  };
}

export function createResourceTree(topology: StackNetworkTopology): {
  nodes: TopologyNode[];
  edges: Edge[];
} {
  if (!topology.networks.length && !topology.workloads.length)
    return { nodes: [], edges: [] };
  const graph = createTopologyGraph(topology);
  const root = `stack:${topology.environmentId}:${topology.stackId}`;
  const rows = Math.max(
    1,
    graph.nodes.filter((node) => node.data.kind === 'network').length,
    topology.workloads.length
  );
  const nodes: TopologyNode[] = [
    {
      id: root,
      type: 'topology',
      position: { x: 0, y: (rows - 1) * 60 },
      data: {
        kind: 'stack',
        label: topology.name,
        description: `${topology.workloads.length} workloads · ${topology.networks.length} networks`,
      },
      ariaLabel: `Stack ${topology.name}`,
    },
    ...graph.nodes.map((node) => ({
      ...node,
      position: { ...node.position, x: node.position.x + 420 },
    })),
  ];
  const children = nodes.filter(
    (node) =>
      node.data.kind === 'network' ||
      (node.data.kind !== 'stack' &&
        !graph.edges.some((edge) => edge.target === node.id))
  );
  const edges: Edge[] = [
    ...children.map((node) => ({
      id: `${root}->${node.id}`,
      source: root,
      target: node.id,
      type: 'smoothstep',
      ariaLabel: `${topology.name} contains ${node.data.label}`,
    })),
    ...graph.edges,
  ];
  return { nodes, edges };
}
