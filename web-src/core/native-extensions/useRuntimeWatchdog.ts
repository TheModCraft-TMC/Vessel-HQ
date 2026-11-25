import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  tripExtensionRuntime,
  type ExtensionRuntimeBinding,
  type ExtensionSafetyReason,
} from '@/domains/extensions';

import {
  createRuntimeWatchdog,
  type RuntimeWatchdog,
  type RuntimeSafetyState,
} from './runtime-watchdog';

const clients = new WeakMap<QueryClient, Map<string, RuntimeWatchdog>>();
const idle: RuntimeSafetyState = { disabled: false, reportFailed: false };
function noopSubscribe() {
  return function unsubscribe() {
    return undefined;
  };
}
function idleSnapshot() {
  return idle;
}

export function useRuntimeWatchdog(
  binding: ExtensionRuntimeBinding | undefined,
  scope: string,
  enabled = true
) {
  const client = useQueryClient();
  const guard = useMemo(() => {
    if (!binding) return undefined;
    let guards = clients.get(client);
    if (!guards) {
      guards = new Map();
      clients.set(client, guards);
    }
    const key = `vessel-extension-safety:${binding.id}:${binding.revision}:${binding.packageDigest}:${binding.updatedAt}`;
    let existing = guards.get(key);
    if (!existing) {
      let initialReason: ExtensionSafetyReason | undefined;
      try {
        const saved = sessionStorage.getItem(key);
        if (
          saved &&
          [
            'request-rate',
            'restart-loop',
            'render-error',
            'repeated-errors',
          ].includes(saved)
        )
          initialReason = saved as ExtensionSafetyReason;
      } catch {
        /* Storage may be unavailable; server revocation still applies. */
      }
      existing = createRuntimeWatchdog(
        async (reason) => {
          try {
            sessionStorage.setItem(key, reason);
          } catch {
            /* Best effort reload protection. */
          }
          await tripExtensionRuntime(binding, reason);
          await client.invalidateQueries(['native-extensions']);
        },
        Date.now,
        initialReason
      );
      if (guards.size >= 256) guards.delete(guards.keys().next().value!);
      guards.set(key, existing);
    }
    return existing;
  }, [binding, client]);
  const state = useSyncExternalStore(
    guard?.subscribe ?? noopSubscribe,
    guard?.getSnapshot ?? idleSnapshot,
    idleSnapshot
  );
  useEffect(() => {
    guard?.ensureReported();
  }, [guard]);
  useEffect(() => {
    if (enabled) guard?.mount(scope);
  }, [guard, scope, enabled]);
  return { guard, state };
}
