import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { createRealtimeInvalidation } from './query-invalidation';

function setup() {
  const resolves: ((value: number) => void)[] = [];
  const cancelled = vi.fn();
  const queryFn = vi.fn(
    ({ signal }: { signal?: AbortSignal }) =>
      new Promise<number>((resolve) => {
        resolves.push(resolve);
        signal?.addEventListener('abort', cancelled);
      })
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['resource'], 0);
  const observer = new QueryObserver(client, {
    queryKey: ['resource'],
    queryFn,
  });
  const unsubscribe = observer.subscribe(() => {});
  const invalidation = createRealtimeInvalidation(client);
  return {
    queryFn,
    cancelled,
    resolves,
    observer,
    invalidation,
    dispose() {
      invalidation.dispose();
      unsubscribe();
      client.clear();
    },
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('coalesces event bursts without cancelling a slow snapshot and refreshes trailing changes', async () => {
  const s = setup();
  try {
    s.invalidation.invalidate();
    for (let i = 0; i < 100; i += 1) s.invalidation.invalidate();
    expect(s.queryFn).toHaveBeenCalledTimes(1);
    expect(s.cancelled).not.toHaveBeenCalled();
    s.resolves[0](1);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(999);
    expect(s.queryFn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.queryFn).toHaveBeenCalledTimes(2);
    expect(s.cancelled).not.toHaveBeenCalled();
    s.resolves[1](2);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(s.queryFn).toHaveBeenCalledTimes(2);
  } finally {
    s.dispose();
  }
});

it('refreshes a snapshot that was already fetching before the event', async () => {
  const s = setup();
  try {
    const response = s.observer.refetch();
    s.invalidation.invalidate();
    expect(s.queryFn).toHaveBeenCalledTimes(1);
    s.resolves[0](1);
    await response;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(s.queryFn).toHaveBeenCalledTimes(2);
    expect(s.cancelled).not.toHaveBeenCalled();
  } finally {
    s.dispose();
  }
});

it('discards queued refreshes after disconnect or logout', async () => {
  const s = setup();
  try {
    s.invalidation.invalidate();
    s.invalidation.invalidate();
    s.invalidation.dispose();
    s.resolves[0](1);
    await vi.advanceTimersByTimeAsync(5_000);
    s.invalidation.invalidate();
    expect(s.queryFn).toHaveBeenCalledTimes(1);
  } finally {
    s.dispose();
  }
});
