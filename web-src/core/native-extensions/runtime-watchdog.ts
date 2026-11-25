import type { ExtensionSafetyReason } from '@/domains/extensions';

export interface RuntimeSafetyState {
  reason?: ExtensionSafetyReason;
  disabled: boolean;
  reportFailed: boolean;
}

/** A host SDK circuit breaker, not a sandbox for trusted browser code. */
export function createRuntimeWatchdog(
  report: (reason: ExtensionSafetyReason) => Promise<void>,
  now = Date.now,
  initialReason?: ExtensionSafetyReason
) {
  let state: RuntimeSafetyState = {
    reason: initialReason,
    disabled: false,
    reportFailed: false,
  };
  let reporting = false;
  const listeners = new Set<() => void>();
  const requests: number[] = [];
  const mounts = new Map<string, number[]>();
  const failures: number[] = [];
  const controller = new AbortController();
  if (initialReason) controller.abort();
  function update(next: RuntimeSafetyState) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  function ensureReported() {
    const reason = state.reason;
    if (!reason || reporting) return;
    reporting = true;
    void report(reason).then(
      () => update({ reason, disabled: true, reportFailed: false }),
      () => update({ reason, disabled: false, reportFailed: true })
    );
  }
  function trip(reason: ExtensionSafetyReason) {
    if (state.reason) return;
    update({ reason, disabled: false, reportFailed: false });
    controller.abort();
    ensureReported();
  }
  function overBudget(entries: number[], limit: number, window: number) {
    const timestamp = now();
    while (entries.length && entries[0] <= timestamp - window) entries.shift();
    entries.push(timestamp);
    return entries.length > limit;
  }
  function assertRunning() {
    if (state.reason)
      throw new Error('Extension runtime blocked by its safety guard.');
  }
  const watchdog = {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    signal: controller.signal,
    trip,
    ensureReported,
    mount(scope: string) {
      if (state.reason) return;
      if (!mounts.has(scope) && mounts.size >= 128)
        mounts.delete(mounts.keys().next().value!);
      const entries = mounts.get(scope) ?? [];
      mounts.set(scope, entries);
      if (overBudget(entries, 6, 60_000)) trip('restart-loop');
    },
    async run<T>(operation: () => Promise<T>): Promise<T> {
      assertRunning();
      if (overBudget(requests, 120, 60_000)) {
        trip('request-rate');
        assertRunning();
      }
      try {
        return await operation();
      } catch (error) {
        // DOMException and Axios errors can originate in another realm.
        const cancelled =
          !!error &&
          typeof error === 'object' &&
          'name' in error &&
          ['AbortError', 'CanceledError'].includes(String(error.name));
        if (!cancelled && !state.reason && overBudget(failures, 8, 30_000))
          trip('repeated-errors');
        throw error;
      }
    },
  };
  return watchdog;
}

export type RuntimeWatchdog = ReturnType<typeof createRuntimeWatchdog>;
