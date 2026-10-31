import { Zapcode, ZapcodeSnapshotHandle } from '@unchartedfr/zapcode';

function send(message) {
  process.send(message, () => {
    if (process.connected) process.disconnect();
  });
}

process.once('message', (workerData) => {
  try {
    const { code, snapshot, value, timeoutMs, memoryLimitBytes, maxOutputBytes, maxSnapshotBytes, names } = workerData;
    const bindings = `const tools = {${names.map((name) => `${JSON.stringify(name)}: async (args = {}) => await vesselCall(${JSON.stringify(name)}, args)`).join(',')}};`;
    const state = snapshot
      ? ZapcodeSnapshotHandle.load(Buffer.from(snapshot)).resume(value)
      : new Zapcode(`${bindings}\n(async () => {\n${code}\n})()`, {
          externalFunctions: ['vesselCall'],
          memoryLimitMb: Math.floor(memoryLimitBytes / 1024 / 1024),
          timeLimitMs: timeoutMs,
        }).start();
    // Discard stdout and native traces; only explicit returns/host calls escape.
    if (state.completed && Buffer.byteLength(JSON.stringify(state.output ?? null)) > maxOutputBytes) {
      send({ type: 'error', error: 'Sandbox output limit exceeded' });
      return;
    }
    if (!state.completed && state.snapshot.byteLength > maxSnapshotBytes) {
      send({ type: 'error', error: 'Sandbox snapshot limit exceeded' });
      return;
    }
    send(state.completed ? { type: 'result', value: state.output ?? null } : { type: 'call', name: state.functionName, args: state.args, snapshot: state.snapshot });
  } catch {
    send({ type: 'error', error: 'Sandbox rejected code or exceeded resource limits' });
  }
});
