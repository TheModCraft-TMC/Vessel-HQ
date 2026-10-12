export function createThrottledPublisher<T>(
  publish: (value: T) => void,
  intervalMs: number
) {
  let pending: T | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function flush() {
    timer = undefined;
    if (pending !== undefined) {
      const value = pending;
      pending = undefined;
      publish(value);
    }
  }

  return {
    publish(value: T) {
      pending = value;
      if (!timer) timer = setTimeout(flush, intervalMs);
    },
    flush,
    close() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      pending = undefined;
    },
  };
}
