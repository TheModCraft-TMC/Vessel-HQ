import { TextDecoderStream } from 'node:stream/web';

import { createSseClient } from '@/core/generated-api/portainer/core/serverSentEvents.gen';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generated SSE cancellation', () => {
  it.each([false, true])(
    'finishes an aborted read when cancellation rejects: %s',
    async (rejectCancellation) => {
      vi.stubGlobal('TextDecoderStream', TextDecoderStream);
      const controller = new AbortController();
      let finishRead!: (result: ReadableStreamReadResult<string>) => void;
      let readerReady!: () => void;
      const ready = new Promise<void>((resolve) => {
        readerReady = resolve;
      });
      const reader = {
        read: vi.fn(
          () =>
            new Promise<ReadableStreamReadResult<string>>((resolve) => {
              finishRead = resolve;
              readerReady();
            })
        ),
        cancel: vi.fn(() => {
          finishRead({ done: true, value: undefined });
          return rejectCancellation
            ? Promise.reject(new Error('Stream already failed'))
            : Promise.resolve();
        }),
        releaseLock: vi.fn(),
      };
      const fetch = vi.fn(async () => ({
        ok: true,
        body: { pipeThrough: () => ({ getReader: () => reader }) },
      })) as unknown as typeof globalThis.fetch;
      const { stream } = createSseClient({
        url: 'https://example.test/events',
        method: 'GET',
        signal: controller.signal,
        fetch,
      });
      const next = stream.next();
      await ready;
      controller.abort();
      await expect(next).resolves.toEqual({ done: true, value: undefined });
      // Let rejected cleanup promises reach the unhandled-rejection checkpoint.
      // Vitest fails the suite if the generated abort callback does not catch it.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(reader.cancel).toHaveBeenCalledOnce();
      expect(reader.releaseLock).toHaveBeenCalledOnce();
    }
  );
});
