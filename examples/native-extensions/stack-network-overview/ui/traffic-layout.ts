import type { Edge, Node } from '@xyflow/react';

import type { StackTrafficOverview } from '@/core/native-extensions/sdk';

import { counterRate } from './traffic';

export interface TrafficNodeData extends Record<string, unknown> {
  kind: 'entrypoint' | 'router' | 'service' | 'container' | 'network';
  label: string;
  description: string;
  details: string[];
  running?: boolean;
  receive?: string;
  transmit?: string;
}
export type TrafficNode = Node<TrafficNodeData, 'device'>;

/** Configured paths and measured workload counters remain distinct. */
export function createTrafficGraph(
  snapshot: StackTrafficOverview,
  previous?: StackTrafficOverview,
  live = false
): { nodes: TrafficNode[]; edges: Edge[] } {
  const nodes = new Map<string, TrafficNode>();
  const edges = new Map<string, Edge>();
  const columns = new Map<string, number>();
  function add(id: string, column: number, data: TrafficNodeData) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        type: 'device',
        width: 190,
        height: 200,
        measured: { width: 190, height: 200 },
        position: { x: 0, y: 0 },
        data,
        ariaLabel: `${data.kind} ${data.label}`,
      });
      columns.set(id, column);
    }
    return id;
  }
  function link(source: string, target: string, active = false) {
    const id = JSON.stringify([source, target]);
    edges.set(id, {
      id,
      source,
      target,
      type: 'smoothstep',
      animated: live && active,
      className: active && live ? 'measured-link' : undefined,
      ariaLabel: `Configured connection from ${nodes.get(source)!.data.label} to ${nodes.get(target)!.data.label}`,
    });
  }
  const workloadIds = new Map<string, string>();
  for (const workload of [...snapshot.workloads].sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const counter = snapshot.traffic.counters.find(
      (item) => item.workloadId === workload.id
    );
    const receive = counter?.available
      ? counterRate(previous, snapshot, workload.id, 'receivedBytes')
      : counter?.reason || 'Unavailable';
    const transmit = counter?.available
      ? counterRate(previous, snapshot, workload.id, 'sentBytes')
      : 'Unavailable';
    workloadIds.set(
      workload.id,
      add(`workload:${workload.kind}:${workload.id}`, 3, {
        kind: workload.kind === 'service' ? 'service' : 'container',
        label: workload.name,
        description: workload.state || 'State not reported',
        running: workload.state ? workload.state === 'running' : undefined,
        receive,
        transmit,
        details: [
          'Aggregate workload network counters; not per-route request metrics.',
          ...workload.networks.map(
            ({ networkId }) =>
              `Network: ${snapshot.networks.find((item) => item.id === networkId)?.name || networkId}`
          ),
        ],
      })
    );
  }
  const routed = new Set<string>();
  for (const router of snapshot.traffic.routers) {
    const routerId = add(
      `router:${JSON.stringify([router.protocol, router.workloadId, router.id])}`,
      1,
      {
        kind: 'router',
        label: router.id,
        description: `${router.protocol.toUpperCase()} · ${router.tls ? 'TLS configured' : 'No TLS label'}`,
        details: [
          router.rule || 'No rule label',
          `Entrypoints: ${router.entryPoints.join(', ') || 'Traefik default'}`,
          `Middlewares: ${router.middlewares.join(' → ') || 'None declared'}`,
        ],
      }
    );
    for (const entry of router.entryPoints.length
      ? router.entryPoints
      : ['Traefik default']) {
      const entryId = add(
        `entry:${JSON.stringify([router.protocol, entry])}`,
        0,
        {
          kind: 'entrypoint',
          label: entry,
          description: `${router.protocol.toUpperCase()} entrypoint`,
          details: [
            'Configured by Docker labels. Listener address and availability are not supplied by these labels.',
          ],
        }
      );
      link(entryId, routerId);
    }
    const reference = router.service.replace(/@docker$/, '');
    const candidates = snapshot.traffic.services.filter(
      (item) => item.id === reference && item.protocol === router.protocol
    );
    const service =
      candidates.find((item) => item.workloadId === router.workloadId) ||
      (candidates.length === 1 ? candidates[0] : undefined);
    const serviceId = add(
      `service:${JSON.stringify([router.protocol, router.workloadId, router.service || router.id])}`,
      2,
      {
        kind: 'service',
        label: router.service || 'Traefik default',
        description: service?.port
          ? `${service.scheme || router.protocol}:${service.port}`
          : 'Port not declared',
        details: [
          service
            ? 'Configured load balancer service.'
            : 'Service resolution is not available from this stack’s labels.',
        ],
      }
    );
    link(routerId, serviceId);
    const targetWorkload =
      service?.workloadId || (!router.service ? router.workloadId : undefined);
    const workloadId = targetWorkload
      ? workloadIds.get(targetWorkload)
      : undefined;
    if (workloadId) {
      routed.add(targetWorkload!);
      const data = nodes.get(workloadId)!.data;
      const active = [data.receive, data.transmit].some(
        (value) => value && /^\d/.test(value) && parseFloat(value) > 0
      );
      link(serviceId, workloadId, active);
    }
  }
  for (const workload of snapshot.workloads.filter(
    (item) => !routed.has(item.id)
  )) {
    for (const { networkId } of workload.networks) {
      const network = snapshot.networks.find((item) => item.id === networkId);
      const id = add(`network:${networkId}`, 0, {
        kind: 'network',
        label: network?.name || networkId,
        description: 'Docker network',
        details: [
          'Network attachment; no Traefik route declared for this workload.',
        ],
      });
      link(id, workloadIds.get(workload.id)!);
    }
  }
  const values = [...nodes.values()];
  const maxRows = Math.max(
    1,
    ...[0, 1, 2, 3].map(
      (column) =>
        values.filter((node) => columns.get(node.id) === column).length
    )
  );
  for (const column of [0, 1, 2, 3]) {
    const group = values.filter((node) => columns.get(node.id) === column);
    group.forEach((node, index) => {
      nodes.set(node.id, {
        ...node,
        position: {
          x: column * 310,
          y: ((maxRows - group.length) / 2 + index) * 210,
        },
      });
    });
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
