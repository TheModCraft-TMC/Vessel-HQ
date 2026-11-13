import { describe, expect, it } from 'vitest';

import {
  createResourceTree,
  filterTopology,
  workloadHealth,
} from './resource-tree';
import type { StackNetworkTopology } from './topology';
const graph: StackNetworkTopology = {
  environmentId: 1,
  stackId: 2,
  name: 'shop',
  networks: [
    {
      id: 'front',
      name: 'Frontend',
      driver: 'bridge',
      scope: 'local',
      internal: false,
    },
  ],
  workloads: [
    {
      id: 'web',
      name: 'Web',
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'front' }],
    },
    {
      id: 'worker',
      name: 'Worker',
      kind: 'container',
      state: 'exited',
      networks: [],
    },
  ],
};
describe('resource tree', () => {
  it('connects the stack to networks and unattached workloads without inventing attachments', () => {
    const tree = createResourceTree(graph);
    expect(tree.nodes).toHaveLength(4);
    expect(tree.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ['stack:1:2', 'network:front'],
      ['stack:1:2', 'workload:container:worker'],
      ['network:front', 'workload:container:web'],
    ]);
  });
  it('retains matching network children and their attachments when searching', () => {
    const filtered = filterTopology(graph, 'Frontend', false);
    expect(filtered.workloads.map((item) => item.id)).toEqual(['web']);
    expect(filtered.networks.map((item) => item.id)).toEqual(['front']);
  });
  it('shows attention states while retaining unknown states as unknown', () => {
    expect(
      filterTopology(graph, '', true).workloads.map((item) => item.id)
    ).toEqual(['worker']);
    expect(workloadHealth()).toBe('unknown');
    expect(workloadHealth('running')).toBe('running');
    expect(workloadHealth('unhealthy')).toBe('attention');
  });
  it('has an empty graph for an empty stack', () => {
    expect(
      createResourceTree({ ...graph, workloads: [], networks: [] })
    ).toEqual({ nodes: [], edges: [] });
  });
});
