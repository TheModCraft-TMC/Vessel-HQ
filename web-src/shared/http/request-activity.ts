import { AxiosHeaders, type AxiosInstance, getAdapter } from 'axios';

export function createRequestActivity() {
  const pending = new Set<symbol>();
  const listeners = new Set<() => void>();
  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => pending.size > 0,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    begin() {
      const token = Symbol();
      pending.add(token);
      notify();
      return () => {
        if (pending.delete(token)) notify();
      };
    },
  };
}

export const requestActivity = createRequestActivity();
const installed = new WeakSet<AxiosInstance>();

export function installRequestActivity(
  instance: AxiosInstance,
  activity = requestActivity
) {
  if (installed.has(instance)) return;
  installed.add(instance);

  instance.interceptors.request.use((config) => {
    if (
      typeof window === 'undefined' ||
      config.responseType === 'stream' ||
      String(AxiosHeaders.from(config.headers).get('Accept')).includes(
        'text/event-stream'
      )
    ) {
      return config;
    }

    const adapter = getAdapter(config.adapter || instance.defaults.adapter);
    return {
      ...config,
      adapter: async (request) => {
        const finish = activity.begin();
        request.signal?.addEventListener?.('abort', finish, { once: true });
        try {
          return await adapter(request);
        } finally {
          request.signal?.removeEventListener?.('abort', finish);
          finish();
        }
      },
    };
  });
}
