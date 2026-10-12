export type WebSocketConnection = {
  readonly readyState: number;
  send: (data: string) => void;
  close: () => void;
};

type WebSocketConnectionOptions = {
  url: string;
  onOpen: () => void;
  onMessage: (event: MessageEvent) => void;
  onClose: () => void;
  onError: (event: Event) => void;
};

/** Owns browser WebSocket construction so consumers only declare behavior. */
export function openWebSocketConnection({
  url,
  onOpen,
  onMessage,
  onClose,
  onError,
}: WebSocketConnectionOptions): WebSocketConnection {
  const socket = new WebSocket(url);
  socket.addEventListener('open', onOpen);
  socket.addEventListener('message', onMessage);
  socket.addEventListener('close', onClose);
  socket.addEventListener('error', onError);
  return socket;
}
