import { HttpResponse, http } from 'msw';

import { server } from '@/core/test-support/setup/server';

import { extensionStorage } from './storage.service';

it('binds reads and writes to the approved registration and package revision', async () => {
  const storage = extensionStorage(7, 4, `sha256:${'a'.repeat(64)}`);
  server.use(
    http.get('/api/native-extensions/7/storage', ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('revision')).toBe('4');
      expect(url.searchParams.get('packageDigest')).toBe(
        `sha256:${'a'.repeat(64)}`
      );
      return HttpResponse.json({ text: 'before', version: 1 });
    }),
    http.put('/api/native-extensions/7/storage', async ({ request }) => {
      expect(await request.json()).toEqual({
        revision: 4,
        packageDigest: `sha256:${'a'.repeat(64)}`,
        text: 'after',
        version: 1,
      });
      return HttpResponse.json({ text: 'after', version: 2 });
    })
  );
  expect(await storage.read()).toEqual({ text: 'before', version: 1 });
  expect(await storage.write({ text: 'after', version: 1 })).toEqual({
    text: 'after',
    version: 2,
  });
});

it('propagates revoked grant and conflicting write errors', async () => {
  server.use(
    http.get('/api/native-extensions/7/storage', () =>
      HttpResponse.json({ message: 'Storage grant revoked' }, { status: 403 })
    ),
    http.put('/api/native-extensions/7/storage', () =>
      HttpResponse.json(
        { message: 'Notes changed; reload before saving' },
        { status: 409 }
      )
    )
  );
  const storage = extensionStorage(7, 4, `sha256:${'a'.repeat(64)}`);
  await expect(storage.read()).rejects.toThrow();
  await expect(storage.write({ text: 'after', version: 1 })).rejects.toThrow();
});
