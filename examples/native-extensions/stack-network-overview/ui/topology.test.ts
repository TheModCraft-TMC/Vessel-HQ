import { describe, expect, it } from 'vitest';

import { createTopologyGraph, type StackNetworkTopology } from './topology';

const topology: StackNetworkTopology = {
  stackId: 5,
  environmentId: 2,
  name: 'shop',
  networks: [
    {
      id: 'front',
      name: 'Frontend',
      driver: 'bridge',
      scope: 'local',
      internal: false,
    },
    {
      id: 'private',
      name: 'Backend',
      driver: 'bridge',
      scope: 'local',
      internal: true,
    },
  ],
  workloads: [
    {
      id: 'web',
      name: 'Web',
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'front' }, { networkId: 'private' }],
    },
    {
      id: 'db',
      name: 'Database',
      kind: 'service',
      networks: [{ networkId: 'private' }],
    },
  ],
};

describe('stack topology graph', () => {
  it('maps container and service attachments to the correct networks without joining unrelated workloads', () => {
    const graph = createTopologyGraph(topology);
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges.map(({ source, target }) => [source, target])).toEqual([
      ['network:private', 'workload:service:db'],
      ['network:front', 'workload:container:web'],
      ['network:private', 'workload:container:web'],
    ]);
    expect(
      graph.nodes.find((node) => node.id === 'network:private')?.data
    ).toMatchObject({
      kind: 'network',
      internal: true,
      description: 'bridge · local · Internal',
    });
  });

  it('keeps node positions and edges stable when API result ordering changes', () => {
    const graph = createTopologyGraph(topology);
    expect(
      createTopologyGraph({
        ...topology,
        networks: [...topology.networks].reverse(),
        workloads: [...topology.workloads].reverse().map((workload) => ({
          ...workload,
          networks: [...workload.networks].reverse(),
        })),
      })
    ).toEqual(graph);
  });

  it('deduplicates repeated network attachments', () => {
    const graph = createTopologyGraph({
      ...topology,
      workloads: [
        {
          ...topology.workloads[0],
          networks: [{ networkId: 'front' }, { networkId: 'front' }],
        },
      ],
    });
    expect(graph.edges).toHaveLength(1);
  });

  it('retains attachments with missing network metadata using an explicit unavailable node', () => {
    const graph = createTopologyGraph({ ...topology, networks: [] });
    expect(
      graph.nodes.find((node) => node.id === 'network:front')?.data
    ).toMatchObject({
      unavailable: true,
      description: 'Network metadata unavailable',
    });
    expect(graph.edges).toHaveLength(3);
    expect(
      graph.edges.every((edge) =>
        graph.nodes.some((node) => node.id === edge.source)
      )
    ).toBe(true);
  });

  it('represents an empty stack without invented nodes', () => {
    expect(
      createTopologyGraph({ ...topology, networks: [], workloads: [] })
    ).toEqual({ nodes: [], edges: [] });
  });
});
