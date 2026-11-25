import { DockerLogStreamDecoder, openDockerLogsStream } from './liveLogs';

class FakeWebSocket {
  static current: FakeWebSocket;

  binaryType: BinaryType = 'blob';

  private listeners = new Map<string, EventListener[]>();

  constructor() {
    FakeWebSocket.current = this;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback =
      typeof listener === 'function'
        ? listener
        : listener.handleEvent.bind(listener);
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback]);
  }

  close() {
    this.emit('close', new Event('close'));
  }

  emit(type: string, event: Event) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

function dockerFrame(text: string, stream = 1) {
  const payload = new TextEncoder().encode(text);
  const frame = new Uint8Array(8 + payload.length);
  frame[0] = stream;
  new DataView(frame.buffer).setUint32(4, payload.length);
  frame.set(payload, 8);
  return frame;
}

describe('DockerLogStreamDecoder', () => {
  it('decodes a raw TTY stream across UTF-8 chunks', () => {
    const decoder = new DockerLogStreamDecoder(false);
    const encoded = new TextEncoder().encode('ready ✓\n');

    expect(decoder.push(encoded.slice(0, encoded.length - 2))).toBe('ready ');
    expect(decoder.push(encoded.slice(encoded.length - 2))).toBe('✓\n');
    expect(decoder.flush()).toBe('');
  });

  it('demultiplexes Docker frames split across websocket messages', () => {
    const decoder = new DockerLogStreamDecoder(true);
    const first = dockerFrame('stdout\n');
    const second = dockerFrame('stderr\n', 2);
    const combined = new Uint8Array(first.length + second.length);
    combined.set(first);
    combined.set(second, first.length);

    expect(decoder.push(combined.slice(0, 5))).toBe('');
    expect(decoder.push(combined.slice(5, first.length + 3))).toBe('stdout\n');
    expect(decoder.push(combined.slice(first.length + 3))).toBe('stderr\n');
    expect(decoder.flush()).toBe('');
  });

  it('rejects oversized frames before buffering their payload', () => {
    const decoder = new DockerLogStreamDecoder(true);
    const header = new Uint8Array(8);
    new DataView(header.buffer).setUint32(4, 16 * 1024 * 1024 + 1);

    expect(() => decoder.push(header)).toThrow('safety limit');
  });

  it('rejects an incomplete multiplexed frame at end of stream', () => {
    const decoder = new DockerLogStreamDecoder(true);
    decoder.push(dockerFrame('partial').slice(0, 10));

    expect(() => decoder.flush()).toThrow('incomplete frame');
  });
});

describe('openDockerLogsStream', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function openStream(onLogs = vi.fn(), tail = 100) {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const stream = openDockerLogsStream({
      environmentId: 1,
      resource: 'containers',
      resourceId: 'abc123',
      timestamps: false,
      since: 0,
      tail,
      multiplexed: false,
      onLogs,
      onError: vi.fn(),
    });
    const socket = FakeWebSocket.current;
    return {
      stream,
      onLogs,
      send(text: string) {
        socket.emit(
          'message',
          new MessageEvent('message', {
            data: new TextEncoder().encode(text).buffer,
          })
        );
      },
    };
  }

  it('publishes one snapshot per burst without changing chunk boundaries into lines', () => {
    const { stream, onLogs, send } = openStream();
    send('first li');
    send('ne\nsecond line\n');
    expect(onLogs).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(onLogs).toHaveBeenCalledTimes(1);
    expect(
      onLogs.mock.calls[0][0].map((line: { line: string }) => line.line)
    ).toEqual(['first line', 'second line']);
    stream.close();
  });

  it('retains the newest complete lines while appending fragmented output', () => {
    const { stream, onLogs, send } = openStream(vi.fn(), 2);
    send('old\nnew');
    send('er\nnewest\n');
    vi.advanceTimersByTime(100);

    expect(
      onLogs.mock.lastCall?.[0].map((line: { line: string }) => line.line)
    ).toEqual(['newer', 'newest']);
    stream.close();
  });

  it('cancels a pending snapshot and ignores late messages after explicit close', () => {
    const { stream, onLogs, send } = openStream();
    send('pending\n');
    stream.close();
    send('late\n');
    vi.advanceTimersByTime(1_000);

    expect(onLogs).not.toHaveBeenCalled();
  });

  it('does not report a partial frame when the user closes the stream', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const onError = vi.fn();
    const stream = openDockerLogsStream({
      environmentId: 1,
      resource: 'containers',
      resourceId: 'abc123',
      timestamps: false,
      since: 0,
      tail: 100,
      multiplexed: true,
      onLogs: vi.fn(),
      onError,
    });
    const partialFrame = dockerFrame('partial').slice(0, 10);
    FakeWebSocket.current.emit(
      'message',
      new MessageEvent('message', { data: partialFrame.buffer })
    );

    stream.close();

    expect(onError).not.toHaveBeenCalled();
  });
});
