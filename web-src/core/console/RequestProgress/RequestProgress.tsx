'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { requestActivity } from '@/shared/http/request-activity';

import styles from './RequestProgress.module.css';

export function RequestProgress() {
  const active = useSyncExternalStore(
    requestActivity.subscribe,
    requestActivity.getSnapshot,
    () => false
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active || !visible) return null;

  return (
    <div className={styles.root} role="progressbar" aria-label="Loading">
      <div className={styles.bar} />
    </div>
  );
}

export function RouteLoadingActivity() {
  useEffect(() => requestActivity.begin(), []);
  return null;
}
