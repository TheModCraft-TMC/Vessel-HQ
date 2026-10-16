'use client';
import type { Edge, Node } from '@xyflow/react';

export interface StackNetworkTopology {
  stackId: number;
  environmentId: number;
  name: string;
  networks: {
    id: string;
    name: string;
    driver: string;
    scope: string;
    internal: boolean;
  }[];
  workloads: {
    id: string;
    name: string;
    kind: 'container' | 'service';
    state?: string;
    networks: { networkId: string }[];
  }[];
}

export interface TopologyNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  kind: 'network' | 'container' | 'service';
  internal?: boolean;
  unavailable?: boolean;
}

export type TopologyNode = Node<TopologyNodeData, 'topology'>;

function compare(
  a: { name: string; id: string },
  b: { name: string; id: string }
) {
  const left = `${a.name}\u0000${a.id}`;
  const right = `${b.name}\u0000${b.id}`;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function createTopologyGraph(topology: StackNetworkTopology): {
  nodes: TopologyNode[];
  edges: Edge[];
} {
  const networks = [
    ...new Map(
      topology.networks.map((network) => [network.id, network])
    ).values(),
  ].sort(compare);
  const workloads = [...topology.workloads].sort(compare);
  const networkIds = new Set(networks.map((network) => network.id));
  const missingNetworkIds = [
    ...new Set(
      workloads
        .flatMap((workload) =>
          workload.networks.map(({ networkId }) => networkId)
        )
        .filter((id) => !networkIds.has(id))
    ),
  ].sort();
  const networkCount = networks.length + missingNetworkIds.length;
  const rows = Math.max(networkCount, workloads.length);
  const networkOffset = (rows - networkCount) * 60;
  const workloadOffset = (rows - workloads.length) * 60;
  function networkNodeId(id: string) {
    return `network:${id}`;
  }
  function workloadNodeId(workload: StackNetworkTopology['workloads'][number]) {
    return `workload:${workload.kind}:${workload.id}`;
  }
  const nodes: TopologyNode[] = [
    ...networks.map(
      (network, index): TopologyNode => ({
        id: networkNodeId(network.id),
        type: 'topology',
        position: { x: 0, y: networkOffset + index * 120 },
        data: {
          label: network.name,
          description: [
            network.driver,
            network.scope,
            network.internal ? 'Internal' : '',
          ]
            .filter(Boolean)
            .join(' · '),
          kind: 'network',
          internal: network.internal,
        },
        ariaLabel: `Network ${network.name}${network.internal ? ', internal' : ''}`,
      })
    ),
    ...missingNetworkIds.map(
      (id, index): TopologyNode => ({
        id: networkNodeId(id),
        type: 'topology',
        position: { x: 0, y: networkOffset + (networks.length + index) * 120 },
        data: {
          label: id,
          description: 'Network metadata unavailable',
          kind: 'network',
          unavailable: true,
        },
        ariaLabel: `Network ${id}, metadata unavailable`,
      })
    ),
    ...workloads.map(
      (workload, index): TopologyNode => ({
        id: workloadNodeId(workload),
        type: 'topology',
        position: { x: 420, y: workloadOffset + index * 120 },
        data: {
          label: workload.name,
          description:
            workload.state ||
            (workload.kind === 'service' ? 'Swarm service' : 'Container'),
          kind: workload.kind,
        },
        ariaLabel: `${workload.kind} ${workload.name}${workload.state ? `, ${workload.state}` : ''}`,
      })
    ),
  ];
  const names = new Map(networks.map((network) => [network.id, network.name]));
  const edges: Edge[] = workloads.flatMap((workload) =>
    [...new Set(workload.networks.map(({ networkId }) => networkId))]
      .sort()
      .map(
        (networkId): Edge => ({
          id: `${networkNodeId(networkId)}->${workloadNodeId(workload)}`,
          source: networkNodeId(networkId),
          target: workloadNodeId(workload),
          type: 'smoothstep',
          ariaLabel: `${workload.name} attached to ${names.get(networkId) || networkId}`,
        })
      )
  );
  return { nodes, edges };
}
