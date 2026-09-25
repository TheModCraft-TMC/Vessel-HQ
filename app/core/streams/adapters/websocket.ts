import {
  exponentialBackoff,
  ReconnectPolicy,
} from '@/core/realtime/reconnect/backoff';

export type WebSocketStreamOptions<T> = {
  url: string;
  decode?: (event: MessageEvent) => T;
  onValue: (value: T) => void;
  onError: (error: Error) => void;
  reconnect?: false | ReconnectPolicy;
  binaryType?: BinaryType;
};

export function openWebSocketStream<T>({
  url,
  decode = (event) => event.data as T,
  onValue,
  onError,
  reconnect = false,
  binaryType,
}: WebSocketStreamOptions<T>) {
  let socket: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let attempt = 0;

  function connect() {
    if (stopped) return;
    socket = new WebSocket(url);
    if (binaryType) socket.binaryType = binaryType;
    const current = socket;

    current.addEventListener('message', (event) => {
      try {
        onValue(decode(event));
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
        close();
      }
    });
    current.addEventListener('open', () => {
      attempt = 0;
    });
    current.addEventListener('error', () => {
      if (!stopped && reconnect === false)
        onError(new Error('WebSocket connection error'));
      current.close();
    });
    current.addEventListener('close', () => {
      if (socket !== current) return;
      socket = undefined;
      if (stopped || reconnect === false) return;
      timer = setTimeout(
        () => {
          timer = undefined;
          attempt += 1;
          connect();
        },
        exponentialBackoff(attempt, reconnect)
      );
    });
  }

  function close() {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = undefined;
    socket?.close();
    socket = undefined;
  }

  connect();
  return { close };
}
