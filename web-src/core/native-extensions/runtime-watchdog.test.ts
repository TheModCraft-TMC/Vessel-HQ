import { createRuntimeWatchdog } from './runtime-watchdog';

it('blocks a request burst before the excess request and revokes once', async () => {
  const report = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue('ok');
  const guard = createRuntimeWatchdog(report, () => 0);
  for (let i = 0; i < 120; i += 1) await guard.run(request);
  await expect(guard.run(request)).rejects.toThrow('blocked');
  await expect(guard.run(request)).rejects.toThrow('blocked');
  expect(request).toHaveBeenCalledTimes(120);
  expect(report).toHaveBeenCalledExactlyOnceWith('request-rate');
  expect(guard.signal.aborted).toBe(true);
  expect(guard.getSnapshot().disabled).toBe(true);
});

it('tracks restart loops per view and ages out normal requests', async () => {
  let now = 0;
  const report = vi.fn().mockResolvedValue(undefined);
  const guard = createRuntimeWatchdog(report, () => now);
  for (let i = 0; i < 10; i += 1) guard.mount(`stack:${i}`);
  for (let i = 0; i < 6; i += 1) guard.mount('same-stack');
  expect(report).not.toHaveBeenCalled();
  now = 60_001;
  guard.mount('same-stack');
  expect(report).not.toHaveBeenCalled();
  for (let i = 0; i < 6; i += 1) guard.mount('same-stack');
  expect(report).toHaveBeenCalledExactlyOnceWith('restart-loop');
});

it('stops repeated failures without counting cancelled operations', async () => {
  const report = vi.fn().mockResolvedValue(undefined);
  const guard = createRuntimeWatchdog(report, () => 0);
  for (let i = 0; i < 10; i += 1)
    await expect(
      guard.run(async () => {
        throw new DOMException('cancelled', 'AbortError');
      })
    ).rejects.toThrow();
  expect(report).not.toHaveBeenCalled();
  for (let i = 0; i < 9; i += 1)
    await expect(
      guard.run(async () => {
        throw new Error('failed');
      })
    ).rejects.toThrow();
  expect(report).toHaveBeenCalledExactlyOnceWith('repeated-errors');
});

it('retains the local block when server revocation fails, without retry spam', async () => {
  const report = vi.fn().mockRejectedValue(new Error('offline'));
  const guard = createRuntimeWatchdog(report, () => 0);
  guard.trip('render-error');
  await Promise.resolve();
  guard.trip('render-error');
  guard.ensureReported();
  expect(report).toHaveBeenCalledTimes(1);
  expect(guard.getSnapshot()).toEqual({
    reason: 'render-error',
    disabled: false,
    reportFailed: true,
  });
  await expect(guard.run(vi.fn())).rejects.toThrow('blocked');
});

it('restores a reload block without making a request during construction', async () => {
  const report = vi.fn().mockResolvedValue(undefined);
  const guard = createRuntimeWatchdog(report, () => 0, 'restart-loop');
  expect(report).not.toHaveBeenCalled();
  await expect(guard.run(vi.fn())).rejects.toThrow('blocked');
  guard.ensureReported();
  expect(report).toHaveBeenCalledExactlyOnceWith('restart-loop');
});
