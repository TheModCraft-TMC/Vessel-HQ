import { http, HttpResponse } from 'msw';

import { server } from '@/core/test-support/setup/server';

import type { ExtensionRecord } from '../models/types';

import { extensionSettings, SettingsError } from './settings.service';

const record: ExtensionRecord = {
  id: 7,
  revision: 4,
  status: 'disabled',
  trustedNativeUI: false,
  grants: [],
  updatedAt: 1,
  manifest: {
    id: 'org.example.settings',
    name: 'Settings',
    version: '1',
    apiVersion: 'v1',
    packageDigest: `sha256:${'a'.repeat(64)}`,
    permissions: [],
  },
};

it('binds reads, replacement writes and resets to the exact package and settings version', async () => {
  const identity = {
    revision: 4,
    packageDigest: record.manifest.packageDigest,
  };
  const initial = {
    version: 1,
    values: { theme: 'dark' },
    secretKeys: ['token'],
  };
  server.use(
    http.get('/api/native-extensions/7/settings', ({ request }) => {
      const params = new URL(request.url).searchParams;
      expect(params.get('revision')).toBe('4');
      expect(params.get('packageDigest')).toBe(identity.packageDigest);
      return HttpResponse.json(initial);
    }),
    http.put('/api/native-extensions/7/settings', async ({ request }) => {
      expect(await request.json()).toEqual({
        ...identity,
        version: 1,
        values: { theme: 'light' },
        secrets: { token: null, password: 'private' },
      });
      return HttpResponse.json({
        version: 2,
        values: { theme: 'light' },
        secretKeys: ['password'],
      });
    }),
    http.delete('/api/native-extensions/7/settings', async ({ request }) => {
      expect(await request.json()).toEqual({ ...identity, version: 2 });
      return HttpResponse.json({ version: 3, values: {}, secretKeys: [] });
    })
  );
  const api = extensionSettings(record);
  expect(await api.read()).toEqual(initial);
  expect(
    await api.update({
      version: 1,
      values: { theme: 'light' },
      secrets: { token: null, password: 'private' },
    })
  ).toEqual({
    version: 2,
    values: { theme: 'light' },
    secretKeys: ['password'],
  });
  expect(await api.reset(2)).toEqual({
    version: 3,
    values: {},
    secretKeys: [],
  });
});

it.each([403, 409, 500])(
  'sanitizes %i errors without retaining secret request or response data',
  async (status) => {
    const secret = 'private-do-not-retain';
    server.use(
      http.put('/api/native-extensions/7/settings', () =>
        HttpResponse.json({ message: secret, details: secret }, { status })
      )
    );
    const error = await extensionSettings(record)
      .update({ version: 0, values: {}, secrets: { token: secret } })
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(SettingsError);
    expect((error as SettingsError).conflict).toBe(status === 409);
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(String(error)).not.toContain(secret);
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('cause');
  }
);
