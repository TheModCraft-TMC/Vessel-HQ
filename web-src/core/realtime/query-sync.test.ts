import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { applyRealtimeEvent, isSnapshotQuery } from './query-sync';

it('limits periodic snapshots to live provider data rather than console metadata', () => {
  for (const key of [
    ['native-extensions'],
    ['native-extensions', 'slots', 15, 334],
    ['users', 'me'],
    ['settings'],
    ['docker', 16, 'containers'],
    ['environments', 15],
  ])
    expect(isSnapshotQuery(key, 15)).toBe(false);
  for (const key of [
    ['environments', {}],
    ['docker', 15, 'containers'],
    ['environments', 15, 'kubernetes', 'applications'],
    ['stacks', 334],
  ])
    expect(isSnapshotQuery(key, 15)).toBe(true);
  expect(isSnapshotQuery(['docker', 15, 'info'])).toBe(false);
});

it('routes periodic events to the bounded snapshot refresh, never broad invalidation', () => {
  const invalidate = vi.fn();
  const snapshot = vi.fn();
  const client = {} as QueryClient;
  expect(
    applyRealtimeEvent(
      client,
      { version: 1, id: 8, type: 'snapshot', endpointId: 15 },
      7,
      invalidate,
      snapshot
    )
  ).toBe(8);
  expect(snapshot).toHaveBeenCalledOnce();
  expect(invalidate).not.toHaveBeenCalled();
  applyRealtimeEvent(
    client,
    { version: 1, id: 8, type: 'snapshot' },
    8,
    invalidate,
    snapshot
  );
  expect(snapshot).toHaveBeenCalledOnce();
});

it('makes no idle metadata or extension requests across four periodic snapshots', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const keys = [
    ['users', 'me'],
    ['settings'],
    ['public'],
    ['version'],
    ['status'],
    ['native-extensions'],
    ['native-extensions', 'settings', 1],
    ['environments', 15],
    ['docker', 15, 'info'],
    ['docker', 15, 'version'],
  ];
  const requests = keys.map(() => vi.fn().mockResolvedValue({}));
  const unsubscribers = keys.map((key, index) => {
    client.setQueryData(key, {});
    return new QueryObserver(client, {
      queryKey: key,
      queryFn: requests[index],
    }).subscribe(() => {});
  });
  try {
    for (let id = 1; id <= 4; id += 1)
      applyRealtimeEvent(client, { version: 1, id, type: 'snapshot' }, id - 1);
    await Promise.resolve();
    requests.forEach((request) => expect(request).not.toHaveBeenCalled());
    applyRealtimeEvent(client, { version: 1, id: 5, type: 'invalidate' }, 4);
    await vi.waitFor(() =>
      requests.forEach((request) => expect(request).toHaveBeenCalledOnce())
    );
  } finally {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});

describe('applyRealtimeEvent', () => {
  it('uses ready messages as a resynchronization barrier', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    const eventId = applyRealtimeEvent(
      queryClient,
      { version: 1, id: 42, type: 'ready' },
      0
    );

    expect(eventId).toBe(42);
    expect(invalidateQueries).toHaveBeenCalledWith(
      { refetchType: 'active' },
      { cancelRefetch: false }
    );
  });

  it('ignores duplicate or out-of-order invalidations', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    const eventId = applyRealtimeEvent(
      queryClient,
      { version: 1, id: 41, type: 'invalidate' },
      42
    );

    expect(eventId).toBe(42);
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('ignores unsupported protocol versions', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    const eventId = applyRealtimeEvent(
      queryClient,
      { version: 2, id: 43, type: 'invalidate' },
      42
    );

    expect(eventId).toBe(42);
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
