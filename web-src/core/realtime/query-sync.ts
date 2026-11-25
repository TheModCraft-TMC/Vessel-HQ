import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { exponentialBackoff } from '@/core/realtime/reconnect/backoff';
import { baseHref } from '@/shared/browser-path';

import { createRealtimeInvalidation } from './query-invalidation';

let socket: WebSocket | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempt = 0;
let lastEventId = 0;
let stopped = false;
let disposeInvalidation: (() => void) | undefined;

const EVENT_PROTOCOL_VERSION = 1;

type RealtimeEvent = {
  version: number;
  id: number;
  type: 'ready' | 'invalidate' | 'snapshot';
  endpointId?: number;
};

export function startRealtimeQuerySync(
  queryClient: QueryClient,
  environmentId?: number
) {
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
  if (
    environmentId &&
    Number.isSafeInteger(environmentId) &&
    environmentId > 0
  ) {
    url.searchParams.set('endpointId', String(environmentId));
  }
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const nextSocket = new WebSocket(url);
  socket = nextSocket;
  const invalidation = createRealtimeInvalidation(queryClient);
  const snapshots = createRealtimeInvalidation(queryClient, {
    predicate: (query) => isSnapshotQuery(query.queryKey, environmentId),
  });
  const environmentLists = createRealtimeInvalidation(queryClient, {
    predicate: (query) => isSnapshotQuery(query.queryKey),
  });
  disposeInvalidation = () => {
    invalidation.dispose();
    snapshots.dispose();
    environmentLists.dispose();
  };

  nextSocket.addEventListener('message', (event) => {
    if (socket !== nextSocket || stopped) {
      return;
    }
    const message = parseRealtimeEvent(event.data);
    if (!message) {
      return;
    }

    lastEventId = applyRealtimeEvent(
      queryClient,
      message,
      lastEventId,
      invalidation.invalidate,
      () =>
        message.endpointId === environmentId
          ? snapshots.invalidate()
          : environmentLists.invalidate()
    );

    if (message.type === 'ready') {
      reconnectAttempt = 0;
    }
  });

  nextSocket.addEventListener('close', () => {
    if (socket !== nextSocket) {
      return;
    }

    socket = undefined;
    invalidation.dispose();
    snapshots.dispose();
    environmentLists.dispose();
    disposeInvalidation = undefined;
    if (!stopped && !reconnectTimer) {
      const delay = exponentialBackoff(reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        startRealtimeQuerySync(queryClient, environmentId);
      }, delay);
    }
  });

  nextSocket.addEventListener('error', () => nextSocket.close());
}

export function stopRealtimeQuerySync() {
  stopped = true;
  lastEventId = 0;
  reconnectAttempt = 0;
  disposeInvalidation?.();
  disposeInvalidation = undefined;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  const previousSocket = socket;
  socket = undefined;
  previousSocket?.close();
}

export function applyRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEvent,
  previousEventId: number,
  invalidate?: () => void,
  snapshot?: () => void
) {
  if (event.version !== EVENT_PROTOCOL_VERSION) {
    return previousEventId;
  }

  if (event.type !== 'ready' && event.id <= previousEventId) {
    return previousEventId;
  }

  // Periodic provider snapshots are not console-wide mutations. In particular,
  // they must not reverify extensions or refetch session/settings/version data.
  if (event.type === 'snapshot') {
    if (snapshot) snapshot();
    else
      void queryClient.invalidateQueries(
        {
          refetchType: 'active',
          predicate: (query) =>
            isSnapshotQuery(query.queryKey, event.endpointId),
        },
        { cancelRefetch: false }
      );
    return event.id;
  }

  // A ready event is also a resynchronization barrier. It is sent only after
  // the server has registered the connection, so the following HTTP snapshot
  // cannot miss a mutation in the fetch-before-subscribe gap.
  if (invalidate) invalidate();
  else
    void queryClient.invalidateQueries(
      { refetchType: 'active' },
      { cancelRefetch: false }
    );
  return event.id;
}

export function isSnapshotQuery(key: QueryKey, environmentId?: number) {
  // Lists include live environment health. Item metadata, authorization and
  // credentials remain mutation-driven; provider resources retain freshness.
  if (key[0] === 'environments') {
    if (typeof key[1] !== 'number') return true;
    return !!environmentId && key[1] === environmentId && key.length > 2;
  }
  if (!environmentId) return false;
  if (['docker', 'azure', 'aci'].includes(String(key[0])))
    return key[1] === environmentId;
  return key[0] === 'stacks';
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
      !Number.isSafeInteger(event.id) ||
      event.id < 0 ||
      !('type' in event) ||
      (event.type !== 'ready' &&
        event.type !== 'invalidate' &&
        event.type !== 'snapshot') ||
      ('endpointId' in event &&
        (typeof event.endpointId !== 'number' ||
          !Number.isSafeInteger(event.endpointId) ||
          event.endpointId <= 0))
    ) {
      return undefined;
    }

    return event as RealtimeEvent;
  } catch {
    // Ignore malformed events and keep the connection alive.
    return undefined;
  }
}
