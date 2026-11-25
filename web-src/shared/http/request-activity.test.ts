import Axios, { type AxiosAdapter, type AxiosResponse } from 'axios';

import {
  createRequestActivity,
  installRequestActivity,
} from './request-activity';

function setup() {
  const pending: {
    resolve: (response: AxiosResponse) => void;
    reject: (error: Error) => void;
    config: Parameters<AxiosAdapter>[0];
  }[] = [];
  const adapter = vi.fn<AxiosAdapter>(
    (config) =>
      new Promise((resolve, reject) =>
        pending.push({ resolve, reject, config })
      )
  );
  const client = Axios.create({ adapter });
  const activity = createRequestActivity();
  installRequestActivity(client, activity);
  function complete(index: number) {
    const request = pending[index];
    request.resolve({
      config: request.config,
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
    });
  }
  return { client, activity, pending, adapter, complete };
}

it('tracks overlapping requests until the final adapter settles', async () => {
  const { client, activity, pending, complete, adapter } = setup();
  const first = client.get('/first');
  const second = client.get('/second');
  await vi.waitFor(() => expect(pending).toHaveLength(2));
  expect(activity.getSnapshot()).toBe(true);
  complete(0);
  await first;
  expect(activity.getSnapshot()).toBe(true);
  complete(1);
  await second;
  expect(activity.getSnapshot()).toBe(false);
  expect(adapter).toHaveBeenCalledTimes(2);
});

it('settles errors without a config and preserves caller progress callbacks', async () => {
  const { client, activity, pending } = setup();
  const progress = vi.fn();
  const response = client.get('/broken', { onDownloadProgress: progress });
  const rejected = response.catch((error: unknown) => error);
  await vi.waitFor(() => expect(pending).toHaveLength(1));
  expect(pending[0].config.onDownloadProgress).toBe(progress);
  pending[0].reject(new Error('broken'));
  await expect(rejected).resolves.toMatchObject({ message: 'broken' });
  expect(activity.getSnapshot()).toBe(false);
});

it('does not poison later activity when a request interceptor rejects', async () => {
  const { client, activity, pending, complete } = setup();
  const interceptor = client.interceptors.request.use(() => {
    throw new Error('rejected before transport');
  });
  await expect(client.get('/blocked')).rejects.toThrow('before transport');
  expect(activity.getSnapshot()).toBe(false);
  client.interceptors.request.eject(interceptor);
  const response = client.get('/next');
  await vi.waitFor(() => expect(pending).toHaveLength(1));
  expect(activity.getSnapshot()).toBe(true);
  complete(0);
  await response;
  expect(activity.getSnapshot()).toBe(false);
});

it('stops immediately on cancellation even before an adapter resolves', async () => {
  const { client, activity, pending, complete } = setup();
  const controller = new AbortController();
  const response = client.get('/cancelled', { signal: controller.signal });
  const rejected = response.catch((error: unknown) => error);
  await vi.waitFor(() => expect(pending).toHaveLength(1));
  controller.abort();
  expect(activity.getSnapshot()).toBe(false);
  complete(0);
  await expect(rejected).resolves.toMatchObject({ code: 'ERR_CANCELED' });
  expect(activity.getSnapshot()).toBe(false);
});

it('excludes persistent event streams and installs once per client', async () => {
  const { client, activity, pending, complete, adapter } = setup();
  installRequestActivity(client, activity);
  const begin = vi.spyOn(activity, 'begin');
  const response = client.get('/events', {
    headers: { Accept: 'text/event-stream' },
  });
  await vi.waitFor(() => expect(pending).toHaveLength(1));
  expect(begin).not.toHaveBeenCalled();
  expect(adapter).toHaveBeenCalledTimes(1);
  complete(0);
  await response;
});
