import type { QueryClient, QueryFilters } from '@tanstack/react-query';

// A burst gets one immediate refresh and one trailing refresh after the current
// snapshot settles. Never repeatedly cancel slow requests while events arrive.
export function createRealtimeInvalidation(
  queryClient: QueryClient,
  filters: QueryFilters = {}
) {
  let disposed = false;
  let running = false;
  let dirty = false;
  let cooldown: ReturnType<typeof setTimeout> | undefined;

  function flush() {
    if (disposed || running) return;
    // An already-running snapshot may predate this event. Follow it with a fresh
    // snapshot instead of cancelling it or treating its result as current.
    dirty = queryClient.isFetching({ ...filters, type: 'active' }) > 0;
    running = true;
    void queryClient
      .invalidateQueries(
        { ...filters, refetchType: 'active' },
        { cancelRefetch: false }
      )
      .catch(() => undefined)
      .finally(() => {
        running = false;
        if (disposed) return;
        cooldown = setTimeout(() => {
          cooldown = undefined;
          if (dirty) flush();
        }, 1_000);
      });
  }

  return {
    invalidate() {
      if (disposed) return;
      dirty = true;
      if (!running && !cooldown) flush();
    },
    dispose() {
      disposed = true;
      dirty = false;
      if (cooldown) clearTimeout(cooldown);
    },
  };
}
