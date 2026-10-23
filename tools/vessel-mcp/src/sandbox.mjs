import { fork } from 'node:child_process';

export const LIMITS = Object.freeze({
  timeoutMs: 10_000,
  memoryLimitBytes: 50 * 1024 * 1024,
  maxCalls: 50,
  maxOutputBytes: 256 * 1024,
  maxCodeBytes: 32 * 1024,
  maxSnapshotBytes: 2 * 1024 * 1024,
});
export class ApprovalRequired extends Error {}

function segment(data, signal) {
  return new Promise((resolve, reject) => {
    const worker = fork(new URL('./sandbox-worker.mjs', import.meta.url), {
      env: {},
      execArgv: ['--max-old-space-size=96'],
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      serialization: 'advanced',
    });
    let settled = false;
    const finish = (error, state) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      worker.kill('SIGKILL');
      if (error) reject(error);
      else resolve(state);
    };
    const cancel = () => finish(new Error('Execution cancelled'));
    const timer = setTimeout(() => finish(new Error('Execution time limit exceeded')), data.timeoutMs);
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    worker.on('message', (state) => (state.type === 'error' ? finish(new Error(state.error)) : finish(null, state)));
    worker.on('error', () => finish(new Error('Sandbox worker failed')));
    worker.on('close', () => finish(new Error('Sandbox process exited without a result')));
    worker.send(data, (error) => {
      if (error) finish(new Error('Sandbox process failed'));
    });
  });
}

export async function execute(code, invoke, { signal, limits = LIMITS, names = [], continuation, onSuspend } = {}) {
  const bound = Object.fromEntries(Object.entries(LIMITS).map(([key, value]) => [key, Math.min(value, limits[key] ?? value)]));
  if (bound.memoryLimitBytes < 1024 * 1024 || Object.values(bound).some((n) => !Number.isSafeInteger(n) || n < 1)) throw new Error('Invalid limits');
  if (typeof code !== 'string' || Buffer.byteLength(code) > bound.maxCodeBytes) throw new Error('Code limit exceeded');
  if (signal?.aborted) throw new Error('Execution cancelled');
  if (
    continuation &&
    (!Number.isSafeInteger(continuation.calls) ||
      continuation.calls < 1 ||
      continuation.calls > bound.maxCalls ||
      !Number.isFinite(continuation.remainingMs) ||
      continuation.remainingMs <= 0)
  )
    throw new Error('Invalid continuation budget');
  const remaining = Math.min(continuation?.remainingMs ?? bound.timeoutMs, bound.timeoutMs);
  const deadline = Date.now() + remaining;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, remaining);
  const interrupted = new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('Execution cancelled or timed out')), { once: true }));
  // Also handle cancellation during a VM segment before a host-call race exists.
  interrupted.catch(() => undefined);
  let calls = continuation?.calls ?? 0;
  let state = continuation?.state;
  let next = { code, names, ...bound };
  try {
    for (;;) {
      if (controller.signal.aborted || Date.now() >= deadline) throw new Error(signal?.aborted ? 'Execution cancelled' : 'Execution time limit exceeded');
      if (!state) state = await segment({ ...next, timeoutMs: deadline - Date.now() }, controller.signal);
      if (state.type === 'result') {
        if (Buffer.byteLength(JSON.stringify(state.value)) > bound.maxOutputBytes) throw new Error('Sandbox output limit exceeded');
        return { status: 'complete', value: state.value, calls };
      }
      if (state.type !== 'call' || state.name !== 'vesselCall' || state.args?.length !== 2 || state.snapshot.byteLength > bound.maxSnapshotBytes)
        throw new Error('Invalid sandbox host call');
      if (!continuation && ++calls > bound.maxCalls) throw new Error('Operation call limit exceeded');
      continuation = undefined;
      let value;
      try {
        value = await Promise.race([invoke(state.args[0], state.args[1], controller.signal), interrupted]);
      } catch (error) {
        if (!(error instanceof ApprovalRequired) || !onSuspend) throw error;
        return { status: 'approval_required', ...(await onSuspend({ state, calls, remainingMs: deadline - Date.now() })), calls };
      }
      if (Buffer.byteLength(JSON.stringify(value ?? null)) > 1024 * 1024) throw new Error('Operation result limit exceeded');
      next = { snapshot: state.snapshot, value, names, ...bound };
      state = undefined;
    }
  } finally {
    clearTimeout(timer);
    controller.abort();
    signal?.removeEventListener('abort', cancel);
  }
}
