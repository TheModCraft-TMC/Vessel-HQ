import type { StackTrafficOverview } from '@/core/native-extensions/sdk';

import { createTrafficGraph } from './traffic-layout';

function example(): StackTrafficOverview {
  return {
    environmentId: 1,
    stackId: 1,
    name: 'shop',
    networks: [
      {
        id: 'private',
        name: 'Private',
        driver: 'bridge',
        scope: 'local',
        internal: true,
      },
    ],
    workloads: ['web', 'worker'].map((id) => ({
      id,
      name: id,
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'private' }],
    })),
    traffic: {
      collectedAt: '2026-10-16T00:00:05Z',
      routers: ['web', 'worker'].map((id) => ({
        id: 'app',
        protocol: 'http',
        workloadId: id,
        rule: `Host(\`${id}.test\`)`,
        entryPoints: ['websecure'],
        service: 'app',
        middlewares: [],
        tls: true,
      })),
      services: ['web', 'worker'].map((workloadId) => ({
        id: 'app',
        protocol: 'http',
        workloadId,
        port: 8080,
        scheme: 'http',
      })),
      middlewares: [],
      counters: ['web', 'worker'].map((workloadId) => ({
        workloadId,
        receivedBytes: '1024',
        sentBytes: '512',
        available: true,
        reason: '',
      })),
      warnings: [],
    },
  };
}

it('keeps same-named routes and services on different workloads distinct and branches shared entrypoints', () => {
  const graph = createTrafficGraph(example());
  expect(graph.nodes.filter((n) => n.data.kind === 'entrypoint')).toHaveLength(
    1
  );
  expect(graph.nodes.filter((n) => n.data.kind === 'router')).toHaveLength(2);
  expect(graph.nodes.filter((n) => n.data.kind === 'service')).toHaveLength(2);
  expect(graph.edges).toHaveLength(6);
  const ids = new Set(graph.nodes.map((n) => n.id));
  expect(
    graph.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target))
  ).toBe(true);
  for (const service of graph.nodes.filter((n) => n.data.kind === 'service')) {
    const edge = graph.edges.find((item) => item.source === service.id)!;
    expect(service.id).toContain(
      graph.nodes.find((n) => n.id === edge.target)!.data.label
    );
  }
});

it('animates only measured workload activity during an explicit live session', () => {
  const current = example();
  const previous = example();
  previous.traffic.collectedAt = '2026-10-16T00:00:00Z';
  previous.traffic.counters.forEach((counter) => {
    counter.receivedBytes = '0';
    counter.sentBytes = '0';
  });
  expect(
    createTrafficGraph(current, previous, false).edges.some((e) => e.animated)
  ).toBe(false);
  const graph = createTrafficGraph(current, previous, true);
  expect(graph.edges.filter((e) => e.animated)).toHaveLength(2);
  expect(
    graph.edges
      .filter((e) => e.animated)
      .every((e) => e.target.startsWith('workload:'))
  ).toBe(true);
  expect(graph.nodes.find((n) => n.data.label === 'web')?.data.receive).toBe(
    '0.20 KiB/s'
  );
  expect(
    createTrafficGraph(current, undefined, true).edges.some((e) => e.animated)
  ).toBe(false);
});

it('shows unlabeled workloads through their Docker network without inventing a Traefik router', () => {
  const input = example();
  input.traffic.routers = [];
  const graph = createTrafficGraph(input);
  expect(graph.nodes.filter((n) => n.data.kind === 'router')).toHaveLength(0);
  expect(graph.nodes.filter((n) => n.data.kind === 'network')).toHaveLength(1);
  expect(graph.edges).toHaveLength(2);
});

it('does not invent a workload destination for an unresolved external service', () => {
  const input = example();
  input.traffic.routers = [
    { ...input.traffic.routers[0], service: 'remote@file' },
  ];
  const graph = createTrafficGraph(input);
  const service = graph.nodes.find(
    (node) => node.data.label === 'remote@file'
  )!;
  expect(graph.edges.some((edge) => edge.source === service.id)).toBe(false);
  expect(graph.nodes.some((node) => node.data.kind === 'network')).toBe(true);
});
