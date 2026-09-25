export interface ClosableStream {
  close(): void;
}

export type StreamListener<T> = (value: T) => void;

export function composeCleanup(...cleanups: Array<() => void>) {
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    cleanups.forEach((cleanup) => cleanup());
  };
}
