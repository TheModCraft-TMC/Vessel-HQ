import { useEffect, useState } from 'react';

import type {
  NativeExtensionProps,
  StackDeliverySnapshot,
  StackNetworkOverview,
} from '@/core/native-extensions/sdk';

import styles from './index.module.css';

const readOperation = 'stacks.delivery.read';
const writeOperation = 'stacks.gitops.sync';
export default function Extension({ context, invoke }: NativeExtensionProps) {
  const [snapshot, setSnapshot] = useState<StackDeliverySnapshot>();
  const [network, setNetwork] = useState<StackNetworkOverview>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const key = `${context.environmentId}:${context.stackId}`;
  const [loadedKey, setLoadedKey] = useState('');
  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');
    setSnapshot(undefined);
    setNetwork(undefined);
    setConfirm(false);
    void Promise.all([
      invoke<StackDeliverySnapshot>(readOperation, context),
      invoke<StackNetworkOverview>('stacks.network.read', context),
    ])
      .then(([data, graph]) => {
        if (disposed) return null;
        if (
          data.environmentId !== context.environmentId ||
          data.stackId !== context.stackId ||
          graph.environmentId !== context.environmentId ||
          graph.stackId !== context.stackId
        )
          throw new Error('Scope mismatch');
        setSnapshot(data);
        setNetwork(graph);
        setLoadedKey(key);
        setBlocked(false);
        return null;
      })
      .catch(() => {
        if (!disposed)
          setError(
            'Unable to load this stack. Check its current extension grants and environment access.'
          );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [invoke, context, key, attempt]);
  const data = loadedKey === key ? snapshot : undefined;
  async function deploy() {
    if (!data || busy || blocked) return;
    setBusy(true);
    setConfirm(false);
    setError('');
    setNotice('');
    try {
      await invoke(writeOperation, { ...context, version: data.version });
      setNotice('Deployment accepted. Refresh status to follow the result.');
      setBlocked(true);
    } catch {
      setError('Deployment was not confirmed. Refresh status before retrying.');
      setBlocked(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.root} aria-label="Stack GitOps">
      <header className={styles.header}>
        <div>
          <h3>Stack GitOps</h3>
          <p>
            {context.stackName} · Environment {context.environmentId}
          </p>
        </div>
        <button
          type="button"
          className={styles.button}
          disabled={loading || busy}
          onClick={() => {
            setNotice('');
            setAttempt((value) => value + 1);
          }}
        >
          Refresh status
        </button>
      </header>
      {loading && <p role="status">Loading stack status…</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {data && (
        <>
          <div className={styles.summary}>
            <span className={styles.badge}>Revision: {data.syncStatus}</span>
            <span className={styles.badge}>
              Deployment:{' '}
              {(
                {
                  1: 'Active',
                  2: 'Inactive',
                  3: 'Deploying',
                  4: 'Error',
                } as Record<number, string>
              )[data.status] || 'Unknown'}
            </span>
            <span>
              {data.updatedAt
                ? `Updated ${new Date(data.updatedAt * 1000).toLocaleString()}`
                : 'No deployment timestamp'}
            </span>
          </div>
          <div className={styles.cards}>
            {data.sources.map((source, index) => (
              <article className={styles.card} key={`${source.id}:${index}`}>
                <h4>Git source → desired revision</h4>
                <p>{source.name || `Source ${source.id}`}</p>
                <p>
                  {source.ref} · {source.path}
                </p>
                <code>{source.desiredRevision || 'Revision unknown'}</code>
                <p>
                  {source.interval
                    ? `Source check interval: ${source.interval}`
                    : 'Source checks not scheduled'}
                </p>
              </article>
            ))}
            <article className={styles.card}>
              <h4>↓ Deployed stack</h4>
              <p>{data.name}</p>
              <code>{data.deployedRevision || 'No recorded revision'}</code>
              <p>
                {data.automaticSync
                  ? 'Automatic source synchronization configured'
                  : 'Manual synchronization'}
                {data.repullOnSync ? ' · Repull images enabled' : ''}
              </p>
            </article>
            {network?.workloads.map((workload) => (
              <article
                className={styles.card}
                key={`${workload.kind}:${workload.id}`}
              >
                <h4>→ {workload.kind}</h4>
                <p>{workload.name}</p>
                <span className={styles.badge}>
                  {workload.state || 'State not reported'}
                </span>
              </article>
            ))}
          </div>
          {data.workflowId === 0 && (
            <p>
              This stack has no Git workflow. Configure its Git source in Vessel
              to enable synchronization.
            </p>
          )}
          <p>
            Revision alignment compares the recorded source commit with the
            deployed commit. It does not prove runtime configuration equality or
            application health. Sync uses the existing source and preserves
            environment values and secrets.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              disabled={
                busy ||
                loading ||
                blocked ||
                data.status === 3 ||
                data.workflowId === 0
              }
              onClick={() => setConfirm(true)}
            >
              Sync from Git
            </button>
          </div>
          {confirm && (
            <div
              className={styles.card}
              role="group"
              aria-label="Confirm deployment"
            >
              <p>
                Synchronize this stack from its configured Git revision?
                Existing deployment and secret resolution rules apply.
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  disabled={busy}
                  onClick={() => void deploy()}
                >
                  Confirm deployment
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setConfirm(false)}
                >
                  Cancel deployment
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
