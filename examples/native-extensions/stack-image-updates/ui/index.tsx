import { useEffect, useState } from 'react';

import type {
  NativeExtensionProps,
  StackDeliverySnapshot,
  StackNetworkOverview,
} from '@/core/native-extensions/sdk';

import styles from './index.module.css';

const readOperation = 'stacks.images.read';
const writeOperation = 'stacks.images.update';
export default function Extension({ context, invoke }: NativeExtensionProps) {
  const [snapshot, setSnapshot] = useState<StackDeliverySnapshot>();
  const [, setNetwork] = useState<StackNetworkOverview>();
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
    <section className={styles.root} aria-label="Stack image updates">
      <header className={styles.header}>
        <div>
          <h3>Stack image updates</h3>
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
          <div className={styles.table}>
            <table>
              <caption>Image update checks for {data.name}</caption>
              <thead>
                <tr>
                  <th>Workload</th>
                  <th>Image</th>
                  <th>Registry status</th>
                  <th>Policy</th>
                </tr>
              </thead>
              <tbody>
                {data.images.map((image) => (
                  <tr key={image.workloadId}>
                    <td>{image.name}</td>
                    <td>{image.reference}</td>
                    <td>{image.status}</td>
                    <td>{image.policy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.images.length === 0 && (
            <p>No workloads found for image checks.</p>
          )}
          <p>
            Registry digests are checked on request. Repull redeploys the entire
            stack using its current image references; it does not select newer
            version tags. Excluded and monitor-only labels block stack-wide
            updates. Background checks run only when explicitly enabled below.
          </p>
          {data.images.some((image) => image.policy !== 'manual') && (
            <p role="status">
              This stack includes excluded or monitor-only workloads. Review
              their labels before a stack-wide image update.
            </p>
          )}
          <AutomationPolicy
            key={data.automation?.version || 0}
            data={data}
            context={context}
            invoke={invoke}
            onSaved={() => setAttempt((value) => value + 1)}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              disabled={
                busy ||
                loading ||
                blocked ||
                data.status === 3 ||
                data.images.length === 0 ||
                data.images.some((image) => image.policy !== 'manual')
              }
              onClick={() => setConfirm(true)}
            >
              Repull and redeploy stack
            </button>
          </div>
          {confirm && (
            <div
              className={styles.card}
              role="group"
              aria-label="Confirm deployment"
            >
              <p>
                Pull the current image references and recreate this stack?
                Running workloads may restart; persistent volumes remain
                governed by the existing deployment configuration.
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

function AutomationPolicy({
  data,
  context,
  invoke,
  onSaved,
}: {
  data: StackDeliverySnapshot;
  context: NativeExtensionProps['context'];
  invoke: NativeExtensionProps['invoke'];
  onSaved: () => void;
}) {
  const policy = data.automation;
  const [enabled, setEnabled] = useState(policy?.enabled || false);
  const [mode, setMode] = useState<'monitor-only' | 'automatic'>(
    policy?.mode || 'monitor-only'
  );
  const [interval, setInterval] = useState(policy?.intervalMinutes || 60);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true);
    setError('');
    try {
      await invoke('stacks.images.configure', {
        ...context,
        automation: {
          version: policy?.version || 0,
          enabled,
          mode,
          intervalMinutes: interval,
        },
      });
      onSaved();
    } catch {
      setError(
        'Unable to save the background policy. Refresh status and check the explicit automation grant.'
      );
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }
  return (
    <section className={styles.card} aria-label="Background image updates">
      <h4>Background image updates</h4>
      <p>
        Runs on the Vessel server while this page is closed. Each run rechecks
        the extension approval and the configuring administrator. Package
        updates and disable turn the job off.
      </p>
      <p>
        Last check:{' '}
        {policy?.lastCheck
          ? new Date(policy.lastCheck * 1000).toLocaleString()
          : 'Never'}{' '}
        · {policy?.lastOutcome || 'Not scheduled'}
      </p>
      <fieldset disabled={busy}>
        <legend>Update policy</legend>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Enable background checks
        </label>
        <label>
          Mode{' '}
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as 'monitor-only' | 'automatic')
            }
          >
            <option value="monitor-only">Monitor only</option>
            <option value="automatic">
              Automatically repull outdated stacks
            </option>
          </select>
        </label>
        <label>
          Interval in minutes{' '}
          <input
            type="number"
            min={5}
            max={1440}
            value={interval}
            onChange={(event) => setInterval(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          className={styles.button}
          disabled={
            !Number.isInteger(interval) || interval < 5 || interval > 1440
          }
          onClick={() => setConfirm(true)}
        >
          Save background policy
        </button>
        {confirm && (
          <div role="group" aria-label="Confirm background policy">
            <p>
              {enabled && mode === 'automatic'
                ? 'Allow Vessel to restart this entire stack automatically when a registry digest changes?'
                : 'Save this background image-check policy?'}
            </p>
            <button
              type="button"
              className={styles.button}
              onClick={() => void save()}
            >
              Confirm policy
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setConfirm(false)}
            >
              Cancel policy
            </button>
          </div>
        )}
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
