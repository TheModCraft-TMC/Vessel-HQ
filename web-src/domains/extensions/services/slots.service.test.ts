import { beforeEach, vi } from 'vitest';

import axios from '@/shared/http';

import {
  getExtensionSlots,
  invokeStackExtension,
  watchStackTraffic,
} from './slots.service';

vi.mock('@/shared/http', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  parseAxiosError: (error: unknown) => error,
}));
beforeEach(() => vi.clearAllMocks());
const binding = { revision: 2, packageDigest: `sha256:${'a'.repeat(64)}` };

it('asks the backend for authorized slots in the exact environment and stack', async () => {
  const records = [
    { id: 4, revision: 2, manifest: { id: 'network-overview' } },
  ];
  vi.mocked(axios.get).mockResolvedValue({ data: records });
  expect(await getExtensionSlots(2, 5)).toEqual(records);
  expect(axios.get).toHaveBeenCalledExactlyOnceWith(
    '/native-extensions/slots',
    { params: { environmentId: 2, stackId: 5 } }
  );
});

it('invokes the registered extension operation with explicit stack and environment scope', async () => {
  const result = { stackId: 5, environmentId: 2, networks: [], workloads: [] };
  vi.mocked(axios.post).mockResolvedValue({ data: result });
  expect(
    await invokeStackExtension(
      4,
      'stacks.network.read',
      {
        environmentId: 2,
        stackId: 5,
      },
      binding
    )
  ).toEqual(result);
  expect(axios.post).toHaveBeenCalledExactlyOnceWith(
    '/native-extensions/4/invoke',
    {
      operation: 'stacks.network.read',
      environmentId: 2,
      stackId: 5,
      ...binding,
    }
  );
});

it('propagates an authorization denial instead of returning cached or empty graph data', async () => {
  vi.mocked(axios.post).mockRejectedValue(
    new Error('Stack scope is not approved')
  );
  await expect(
    invokeStackExtension(
      4,
      'stacks.network.read',
      {
        environmentId: 2,
        stackId: 5,
      },
      binding
    )
  ).rejects.toThrow('Stack scope is not approved');
});

it('parses split live frames, binds the stream and cancels its reader on completion', async () => {
  const encoder = new TextEncoder();
  const cancel = vi.fn();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: snap'));
      controller.enqueue(
        encoder.encode(
          'shot\ndata: {"stackId":5,"environmentId":2}\n\nevent: end\ndata: {}\n\n'
        )
      );
    },
    cancel,
  });
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(stream, { status: 200 }));
  try {
    const accept = vi.fn();
    const controller = new AbortController();
    await watchStackTraffic(
      4,
      { environmentId: 2, stackId: 5 },
      binding,
      accept,
      controller.signal
    );
    expect(accept).toHaveBeenCalledExactlyOnceWith({
      stackId: 5,
      environmentId: 2,
    });
    expect(cancel).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      '/api/native-extensions/4/traffic-stream',
      expect.objectContaining({
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          operation: 'stacks.traffic.read',
          environmentId: 2,
          stackId: 5,
          ...binding,
        }),
      })
    );
  } finally {
    fetch.mockRestore();
  }
});

it('fails a denied live request before delivering any samples', async () => {
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('{}', { status: 403 }));
  try {
    const accept = vi.fn();
    await expect(
      watchStackTraffic(
        4,
        { environmentId: 2, stackId: 5 },
        binding,
        accept,
        new AbortController().signal
      )
    ).rejects.toThrow('403');
    expect(accept).not.toHaveBeenCalled();
  } finally {
    fetch.mockRestore();
  }
});
