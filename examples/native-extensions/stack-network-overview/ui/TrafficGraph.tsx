import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type NodeProps,
} from '@xyflow/react';
import { Box, Globe, Network, Route, Server } from 'lucide-react';

import type { StackTrafficOverview } from '@/core/native-extensions/sdk';

import { createTrafficGraph, type TrafficNode } from './traffic-layout';
import { useGraphTheme } from './useGraphTheme';
import styles from './index.module.css';
import { GraphViewport } from './GraphViewport';

const icons = {
  entrypoint: Globe,
  router: Route,
  service: Server,
  container: Box,
  network: Network,
};
function DeviceNode({ data, selected }: NodeProps<TrafficNode>) {
  const Icon = icons[data.kind];
  return (
    <div className={styles.device} data-selected={selected}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className={styles.deviceIcon}>
        <Icon size={30} strokeWidth={1.5} aria-hidden />
        {data.running !== undefined && (
          <span
            className={styles.deviceState}
            data-running={data.running}
            aria-label={data.running ? 'Running' : 'Not running'}
          />
        )}
      </div>
      <strong title={data.label}>{data.label}</strong>
      <small>{data.description}</small>
      {data.receive && (
        <span className={styles.deviceRates}>
          ↓ {data.receive}
          <br />↑ {data.transmit}
        </span>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { device: DeviceNode };

export function TrafficGraph({
  snapshot,
  previous,
  live,
}: {
  snapshot: StackTrafficOverview;
  previous?: StackTrafficOverview;
  live: boolean;
}) {
  const mode = useGraphTheme();
  const [selected, setSelected] = useState('');
  const graph = useMemo(
    () => createTrafficGraph(snapshot, previous, live),
    [snapshot, previous, live]
  );
  const focused = graph.nodes.find((node) => node.id === selected);
  return (
    <div className={styles.topologyLayout}>
      <div className={styles.mapHeader} aria-hidden>
        <span>ENTRYPOINT / NETWORK</span>
        <span>ROUTER</span>
        <span>SERVICE</span>
        <span>WORKLOAD</span>
      </div>
      <div
        className={`${styles.canvas} ${styles.trafficCanvas}`}
        role="region"
        aria-label={`Traffic topology for ${snapshot.name}`}
      >
        <ReactFlow
          nodes={graph.nodes.map((node) => ({
            ...node,
            selected: node.id === selected,
          }))}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          colorMode={mode}
          onNodesChange={(changes) => {
            for (const change of changes) {
              if (change.type === 'select' && change.selected) {
                setSelected(change.id);
                return;
              }
            }
            if (
              changes.some(
                (change) =>
                  change.type === 'select' &&
                  !change.selected &&
                  change.id === selected
              )
            )
              setSelected('');
          }}
          onNodeClick={(_event, node) => setSelected(node.id)}
          onPaneClick={() => setSelected('')}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.15}
          maxZoom={1.6}
          ariaLabelConfig={{
            'node.a11yDescription.keyboardDisabled':
              'Select a device to inspect its configuration and measured workload rates.',
          }}
        >
          <GraphViewport />
          <Background gap={24} size={1} color="var(--vessel-color-border)" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor="var(--vessel-color-focus)" />
        </ReactFlow>
      </div>
      <aside
        className={styles.inspector}
        aria-label="Topology details"
        aria-live="polite"
      >
        {focused ? (
          <>
            <strong>{focused.data.label}</strong>
            <span>{focused.data.description}</span>
            {focused.data.details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
            {focused.data.receive && (
              <p>
                Receive: {focused.data.receive} · Transmit:{' '}
                {focused.data.transmit}
              </p>
            )}
          </>
        ) : (
          <>
            <strong>Select a device to inspect</strong>
            <span>
              Follow the configured path from an entrypoint through its router
              and service to a workload. Animated workload links indicate
              measured network activity during live sampling.
            </span>
          </>
        )}
      </aside>
    </div>
  );
}
