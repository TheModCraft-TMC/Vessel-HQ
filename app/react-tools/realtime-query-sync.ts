import type { QueryClient } from '@tanstack/react-query';

import { baseHref } from '@/portainer/helpers/pathHelper';

let socket: WebSocket | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempt = 0;
let lastEventId = 0;
let stopped = false;

const EVENT_PROTOCOL_VERSION = 1;
const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

type RealtimeEvent = {
  version: number;
  id: number;
  type: 'ready' | 'invalidate';
};

export function startRealtimeQuerySync(queryClient: QueryClient) {
  if (
    process.env.NODE_ENV === 'test' ||
    typeof window === 'undefined' ||
    typeof WebSocket === 'undefined' ||
    socket
  ) {
    return;
  }

  stopped = false;

  const base = new URL(baseHref(), window.location.origin);
  const url = new URL('api/websocket/events', base);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const nextSocket = new WebSocket(url);
  socket = nextSocket;

  nextSocket.addEventListener('message', (event) => {
    const message = parseRealtimeEvent(event.data);
    if (!message) {
      return;
    }

    lastEventId = applyRealtimeEvent(queryClient, message, lastEventId);

    if (message.type === 'ready') {
      reconnectAttempt = 0;
    }
  });

  nextSocket.addEventListener('close', () => {
    if (socket !== nextSocket) {
      return;
    }

    socket = undefined;
    if (!stopped && !reconnectTimer) {
      const delay = reconnectDelay(reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        startRealtimeQuerySync(queryClient);
      }, delay);
    }
  });

  nextSocket.addEventListener('error', () => nextSocket.close());
}

export function stopRealtimeQuerySync() {
  stopped = true;
  lastEventId = 0;
  reconnectAttempt = 0;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  socket?.close();
  socket = undefined;
}

export function applyRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEvent,
  previousEventId: number
) {
  if (event.version !== EVENT_PROTOCOL_VERSION) {
    return previousEventId;
  }

  if (event.type === 'invalidate' && event.id <= previousEventId) {
    return previousEventId;
  }

  // A ready event is also a resynchronization barrier. It is sent only after
  // the server has registered the connection, so the following HTTP snapshot
  // cannot miss a mutation in the fetch-before-subscribe gap.
  void queryClient.invalidateQueries({ refetchType: 'active' });
  return event.id;
}

function parseRealtimeEvent(payload: unknown): RealtimeEvent | undefined {
  if (typeof payload !== 'string') {
    return undefined;
  }

  try {
    const event: unknown = JSON.parse(payload);
    if (
      typeof event !== 'object' ||
      event === null ||
      !('version' in event) ||
      event.version !== EVENT_PROTOCOL_VERSION ||
      !('id' in event) ||
      typeof event.id !== 'number' ||
      !('type' in event) ||
      (event.type !== 'ready' && event.type !== 'invalidate')
    ) {
      return undefined;
    }

    return event as RealtimeEvent;
  } catch {
    // Ignore malformed events and keep the connection alive.
    return undefined;
  }
}

function reconnectDelay(attempt: number) {
  const exponentialDelay = Math.min(
    MAX_RECONNECT_DELAY,
    MIN_RECONNECT_DELAY * 2 ** attempt
  );
  const jitter = Math.floor(Math.random() * Math.min(1000, exponentialDelay));
  return exponentialDelay + jitter;
}
