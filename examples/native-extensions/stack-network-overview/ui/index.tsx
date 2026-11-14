import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { NativeExtensionProps } from '@/core/native-extensions/sdk';

import {
  createTopologyGraph,
  type StackNetworkTopology,
  type TopologyNode,
} from './topology';
import styles from './index.module.css';
import { GraphViewport } from './GraphViewport';
import { TrafficPanel } from './TrafficPanel';
import { useGraphTheme } from './useGraphTheme';
import {
  createResourceTree,
  filterTopology,
  workloadHealth,
} from './resource-tree';

export type StackNetworkExtensionProps = NativeExtensionProps;

type Snapshot =
  | { key: string; status: 'ready'; data: StackNetworkTopology }
  | { key: string; status: 'loading' }
  | { key: string; status: 'error'; message: string };

function NetworkNode({ data }: NodeProps<TopologyNode>) {
  const network = data.kind === 'network';
  const root = data.kind === 'stack';
  return (
    <div
      className={`${styles.node} ${network ? styles.network : styles.workload}`}
    >
      <Handle
        type={network || root ? 'source' : 'target'}
        position={network || root ? Position.Right : Position.Left}
        isConnectable={false}
      />
      {network && (
        <Handle type="target" position={Position.Left} isConnectable={false} />
      )}
      <span className={styles.kind}>
        {root
          ? 'Stack'
          : network
            ? 'Network'
            : data.kind === 'service'
              ? 'Service'
              : 'Container'}
      </span>
      <strong title={data.label}>{data.label}</strong>
      <span className={styles.description}>{data.description}</span>
    </div>
  );
}

const nodeTypes = { topology: NetworkNode };
const readOnlyLabels = {
  'node.a11yDescription.default':
    'Press Enter or Space to select a node. Press Escape to clear selection.',
  'node.a11yDescription.keyboardDisabled': 'Read-only topology node.',
  'edge.a11yDescription.default':
    'Press Enter or Space to select a connection. Press Escape to clear selection.',
};

function NetworkAttachments({ context, invoke }: StackNetworkExtensionProps) {
  const mode = useGraphTheme();
  const { environmentId, stackId, stackName } = context;
  const [attempt, setAttempt] = useState(0);
  const [layout, setLayout] = useState<'tree' | 'attachments'>('tree');
  const [search, setSearch] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selected, setSelected] = useState('');
  const key = `${environmentId}:${stackId}:${attempt}`;
  const validScope =
    Number.isSafeInteger(environmentId) &&
    environmentId > 0 &&
    Number.isSafeInteger(stackId) &&
    stackId > 0;
  const [snapshot, setSnapshot] = useState<Snapshot>({
    key,
    status: 'loading',
  });

  useEffect(() => {
    let disposed = false;
    if (!validScope)
      return () => {
        disposed = true;
      };
    void invoke<StackNetworkTopology>('stacks.network.read', {
      environmentId,
      stackId,
    })
      .then((data) => {
        if (disposed) return null;
        if (data.environmentId !== environmentId || data.stackId !== stackId) {
          setSnapshot({
            key,
            status: 'error',
            message:
              'The response does not match the selected stack. Reopen this extension from the stack.',
          });
          return null;
        }
        setSnapshot({ key, status: 'ready', data });
        return null;
      })
      .catch((error: unknown) => {
        if (!disposed)
          setSnapshot({
            key,
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Unable to read this stack’s network topology. Check its environment scope and the extension permission.',
          });
      });
    return () => {
      disposed = true;
    };
  }, [environmentId, stackId, key, invoke, validScope]);

  const topology =
    validScope && snapshot.key === key && snapshot.status === 'ready'
      ? snapshot.data
      : undefined;
  const filtered = useMemo(
    () =>
      topology ? filterTopology(topology, search, attentionOnly) : undefined,
    [topology, search, attentionOnly]
  );
  const graph = useMemo(
    () =>
      filtered
        ? layout === 'tree'
          ? createResourceTree(filtered)
          : createTopologyGraph(filtered)
        : { nodes: [], edges: [] },
    [filtered, layout]
  );
  const inspected = graph.nodes.find((node) => node.id === selected);
  const attentionCount =
    topology?.workloads.filter(
      (workload) => workloadHealth(workload.state) === 'attention'
    ).length || 0;
  const networkNames = useMemo(
    () =>
      new Map(topology?.networks.map((network) => [network.id, network.name])),
    [topology]
  );

  return (
    <section className={styles.root} aria-label="Stack network overview">
      <header className={styles.header}>
        <div>
          <h3>Network overview</h3>
          <p>{stackName} · Networks and workloads in this stack</p>
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={() => setAttempt((previous) => previous + 1)}
          disabled={
            !validScope || snapshot.key !== key || snapshot.status === 'loading'
          }
        >
          Refresh topology
        </button>
      </header>
      {validScope &&
        (snapshot.key !== key || snapshot.status === 'loading') && (
          <p role="status">Reading stack networks…</p>
        )}
      {!validScope && (
        <p role="alert">
          Select a valid stack and environment to view its network topology.
        </p>
      )}
      {validScope && snapshot.key === key && snapshot.status === 'error' && (
        <div role="alert" className={styles.error}>
          <strong>Network overview unavailable</strong>
          <p>{snapshot.message}</p>
          <p>
            The extension needs explicit permission for this environment and
            access to this stack.
          </p>
        </div>
      )}
      {topology && (
        <div className={styles.toolbar}>
          <label>
            Filter resources
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, network or state"
            />
          </label>
          <label>
            Layout
            <select
              value={layout}
              onChange={(event) =>
                setLayout(event.target.value as 'tree' | 'attachments')
              }
            >
              <option value="tree">Resource tree</option>
              <option value="attachments">Network attachments</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(event) => setAttentionOnly(event.target.checked)}
            />
            Needs attention ({attentionCount})
          </label>
          <label>
            Inspect resource
            <select
              value={inspected?.id || ''}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">Select a resource</option>
              {graph.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.kind}: {node.data.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {inspected && (
        <aside className={styles.inspector} aria-label="Resource inspector">
          <h4>{inspected.data.label}</h4>
          <p>
            {inspected.data.kind} · {inspected.data.description}
          </p>
          <code>{inspected.id}</code>
          <p>
            {
              graph.edges.filter(
                (edge) =>
                  edge.source === inspected.id || edge.target === inspected.id
              ).length
            }{' '}
            connections in this view
          </p>
          <button
            type="button"
            className={styles.button}
            onClick={() => setSelected('')}
          >
            Close inspector
          </button>
        </aside>
      )}
      {topology &&
        filtered?.workloads.length === 0 &&
        filtered.networks.length === 0 && (
          <p>No resources match the current filters.</p>
        )}
      {topology && graph.nodes.length === 0 && (
        <p>No networks or workloads were found for this stack.</p>
      )}
      {topology && graph.nodes.length > 0 && (
        <>
          <div className={styles.summary}>
            <span>{topology.networks.length} networks</span>
            <span>
              {topology.workloads.length}{' '}
              {topology.workloads.some(
                (workload) => workload.kind === 'service'
              )
                ? 'services / containers'
                : 'containers'}
            </span>
            <span>
              {layout === 'tree'
                ? 'Stack → networks → workloads'
                : 'Connections show network attachments'}{' '}
              · Running state is not application health
            </span>
          </div>
          <div
            className={styles.canvas}
            role="region"
            aria-label={`Network topology for ${stackName}`}
          >
            <ReactFlow
              key={`${key}:${layout}:${search}:${attentionOnly}`}
              onNodeClick={(_event, node) => setSelected(node.id)}
              colorMode={mode}
              defaultNodes={graph.nodes}
              defaultEdges={graph.edges}
              deleteKeyCode={null}
              ariaLabelConfig={readOnlyLabels}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={1.8}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesReconnectable={false}
              proOptions={{ hideAttribution: false }}
            >
              <GraphViewport />
              <Background
                gap={20}
                size={1}
                color="var(--vessel-color-border)"
              />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) =>
                  node.data.kind === 'network'
                    ? 'var(--vessel-color-focus)'
                    : 'var(--vessel-color-text-muted)'
                }
              />
            </ReactFlow>
          </div>
          <details className={styles.alternative}>
            <summary>View network attachments as a table</summary>
            <div className={styles.tableWrap}>
              <table>
                <caption>Network attachments for {stackName}</caption>
                <thead>
                  <tr>
                    <th scope="col">Workload</th>
                    <th scope="col">Type</th>
                    <th scope="col">State</th>
                    <th scope="col">Networks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.workloads.map((workload) => (
                    <tr key={`${workload.kind}:${workload.id}`}>
                      <th scope="row">{workload.name}</th>
                      <td>{workload.kind}</td>
                      <td>{workload.state || 'Not reported'}</td>
                      <td>
                        {workload.networks.length
                          ? [
                              ...new Set(
                                workload.networks.map(
                                  ({ networkId }) =>
                                    networkNames.get(networkId) ||
                                    `${networkId} (metadata unavailable)`
                                )
                              ),
                            ].join(', ')
                          : 'No network attachments'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export default function StackNetworkOverview({
  context,
  invoke,
  watchTraffic,
}: NativeExtensionProps) {
  const [view, setView] = useState<'network' | 'traffic' | 'config'>('network');
  return (
    <div className={styles.root}>
      <nav className={styles.summary} aria-label="Network overview views">
        {(
          [
            ['network', 'Networks'],
            ['traffic', 'Traffic flow'],
            ['config', 'Traefik config'],
          ] as const
        ).map(([id, title]) => (
          <button
            type="button"
            key={id}
            className={styles.button}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {title}
          </button>
        ))}
      </nav>
      {view === 'network' ? (
        <NetworkAttachments context={context} invoke={invoke} />
      ) : (
        <TrafficPanel
          context={context}
          invoke={invoke}
          watchTraffic={watchTraffic}
          mode={view}
        />
      )}
    </div>
  );
}
