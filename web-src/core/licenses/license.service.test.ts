import { http, HttpResponse } from 'msw';

import { server } from '@/core/test-support/setup/server';
import PortainerError from '@/shared/errors';

import {
  getLicenses,
  attachLicense,
  removeLicense,
  resetState,
} from './license.service';
import type { License } from './types';

describe('getLicenses', () => {
  it('on success should return the server body', async () => {
    const catchFn = vi.fn();
    const thenFn = vi.fn();

    const data: License[] = [];
    server.use(http.get('/api/licenses', () => HttpResponse.json(data)));

    const promise = getLicenses();

    await promise.then(thenFn).catch(catchFn);

    expect(catchFn).not.toHaveBeenCalled();
    expect(thenFn).toHaveBeenCalledWith(data);
  });

  it('on failure should return the server message', async () => {
    const catchFn = vi.fn();
    const thenFn = vi.fn();

    const message = 'message';
    const details = 'details';

    server.use(
      http.get('/api/licenses', () =>
        HttpResponse.json({ message, details }, { status: 400 })
      )
    );

    const promise = getLicenses();
    await promise.then(thenFn, catchFn);

    expect(catchFn).toHaveBeenCalledWith(
      new PortainerError(details, new Error(message))
    );
    expect(thenFn).not.toHaveBeenCalled();
  });
});

describe.each([
  { name: 'attach', action: '', mutate: attachLicense },
  { name: 'remove', action: '/remove', mutate: removeLicense },
])('$name license refresh', ({ action, mutate }) => {
  it('waits for refreshed license info after a successful mutation', async () => {
    resetState();
    let refreshed = false;
    server.use(
      http.post(`/api/licenses${action}`, () =>
        HttpResponse.json({ failedKeys: {} })
      ),
      http.get('/api/licenses/info', () => {
        refreshed = true;
        return HttpResponse.json({});
      })
    );
    await mutate(['test-license']);
    expect(refreshed).toBe(true);
  });

  it('propagates refresh failures rather than leaving an unhandled rejection', async () => {
    resetState();
    server.use(
      http.post(`/api/licenses${action}`, () =>
        HttpResponse.json({ failedKeys: {} })
      ),
      http.get('/api/licenses/info', () =>
        HttpResponse.json({ message: 'Refresh failed' }, { status: 500 })
      )
    );
    await expect(mutate(['test-license'])).rejects.toThrow();
  });
});
