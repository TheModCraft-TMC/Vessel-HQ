'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  NativeExtensionProps,
  StackTrafficOverview,
} from '@/core/native-extensions/sdk';

import styles from './index.module.css';
import { TrafficGraph } from './TrafficGraph';

export { counterRate } from './traffic';

type Pair = { current?: StackTrafficOverview; previous?: StackTrafficOverview };

export function TrafficPanel({
  context,
  invoke,
  watchTraffic,
  mode,
}: NativeExtensionProps & { mode: 'traffic' | 'config' }) {
  const [pair, setPair] = useState<Pair>({});
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState(
    'Loading routing labels and Docker counters…'
  );
  const controller = useRef<AbortController | null>(null);
  const { environmentId, stackId, stackName } = context;

  const accept = useCallback(
    (snapshot: StackTrafficOverview) => {
      if (
        snapshot.environmentId !== environmentId ||
        snapshot.stackId !== stackId ||
        !snapshot.traffic
      )
        throw new Error('Traffic response does not match this stack.');
      setPair((previous) => ({
        previous: previous.current,
        current: snapshot,
      }));
    },
    [environmentId, stackId]
  );

  useEffect(() => {
    let active = true;
    void invoke<StackTrafficOverview>('stacks.traffic.read', {
      environmentId,
      stackId,
    })
      .then((snapshot) => {
        if (active) {
          accept(snapshot);
          setError('');
          setStatus('Snapshot loaded from Docker.');
        }
        return null;
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Traffic read failed.'
          );
          setStatus('Traffic unavailable.');
        }
      });
    return () => {
      active = false;
    };
  }, [accept, invoke, environmentId, stackId, attempt]);

  useEffect(() => () => controller.current?.abort(), []);

  function startLive() {
    if (!watchTraffic || live) return;
    const current = new AbortController();
    controller.current = current;
    setLive(true);
    setError('');
    setStatus(
      'Live Docker traffic · samples every 5 seconds · one-minute session'
    );
    void watchTraffic(accept, current.signal)
      .then(() => {
        if (!current.signal.aborted)
          setStatus('Live session ended. Start again to continue.');
        return null;
      })
      .catch((reason: unknown) => {
        if (!current.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : 'Live traffic failed.'
          );
          setStatus('Live session stopped.');
        }
      })
      .finally(() => {
        if (controller.current === current) {
          controller.current = null;
          setLive(false);
        }
      });
  }

  const snapshot = pair.current;
  const traffic = snapshot?.traffic;
  return (
    <section
      className={styles.root}
      aria-label={
        mode === 'traffic' ? 'Stack traffic flow' : 'Traefik configuration'
      }
    >
      <header className={styles.header}>
        <div>
          <h3>
            {mode === 'traffic' ? 'Traffic flow' : 'Traefik configuration'}
          </h3>
          <p>{stackName} · Docker socket · selected stack only</p>
        </div>
        <div className={styles.summary}>
          <button
            className={styles.button}
            type="button"
            disabled={live}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Refresh traffic
          </button>
          {mode === 'traffic' &&
            (live ? (
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  controller.current?.abort();
                  setLive(false);
                  setStatus('Live traffic stopped.');
                }}
              >
                Stop live traffic
              </button>
            ) : (
              <button
                className={styles.button}
                type="button"
                disabled={!watchTraffic || !traffic}
                onClick={startLive}
              >
                Start live traffic
              </button>
            ))}
        </div>
      </header>
      <p role="status">{status}</p>
      {error && (
        <p role="alert">
          {error} Traffic needs its separately approved stack grant.
        </p>
      )}
      {traffic && mode === 'traffic' && (
        <>
          <p>
            Configured routes show intended connections, not observed requests.
            Live rates below measure container network bytes, including internal
            traffic.
          </p>
          {!traffic.routers.length && (
            <p>No Traefik router labels were found in this stack.</p>
          )}
          <TrafficGraph
            snapshot={snapshot!}
            previous={pair.previous}
            live={live}
          />
          <p className={styles.description}>
            Link and device rates are aggregate container RX/TX from Docker,
            including internal traffic. HTTP request counts and per-route
            latency need Traefik metrics or access logs.
          </p>
        </>
      )}
      {traffic && mode === 'config' && (
        <>
          <p>
            Safe routing settings extracted from labels on this stack.
            Authentication values, custom header values and unknown middleware
            settings are redacted. Static Traefik settings and file-provider
            configuration are not stored in Docker labels.
          </p>
          {!traffic.routers.length &&
            !traffic.services.length &&
            !traffic.middlewares.length && (
              <p>No Traefik routing configuration was found in this stack.</p>
            )}
          <pre className={styles.configuration}>
            {JSON.stringify(
              {
                routers: traffic.routers,
                services: traffic.services,
                middlewares: traffic.middlewares,
              },
              null,
              2
            )}
          </pre>
        </>
      )}
      {traffic?.warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
      {traffic && (
        <small>
          Collected {new Date(traffic.collectedAt).toLocaleTimeString()}
        </small>
      )}
    </section>
  );
}
