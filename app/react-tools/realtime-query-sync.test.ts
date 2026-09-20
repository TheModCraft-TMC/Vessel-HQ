import type { QueryClient } from '@tanstack/react-query';

import { applyRealtimeEvent } from './realtime-query-sync';

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
    expect(invalidateQueries).toHaveBeenCalledWith({ refetchType: 'active' });
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
