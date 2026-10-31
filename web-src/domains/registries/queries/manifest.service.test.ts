import { createHash } from 'node:crypto';

import { vi } from 'vitest';

import axios from '@/shared/http';

import { getTagManifestV2 } from './manifest.service';

vi.mock('@/shared/http', () => ({
  default: { get: vi.fn() },
  parseAxiosError: (error: unknown) => error,
}));

it('hashes exact manifest text and produces a downstream-compatible digest', async () => {
  const body = '{ "schemaVersion": 2, "config": {}, "layers": [] }\n';
  vi.mocked(axios.get).mockResolvedValue({ data: body, headers: {} });
  const result = await getTagManifestV2({
    id: 1,
    repository: 'test',
    tag: 'latest',
  });
  expect(result.digest).toBe(
    `sha256:${createHash('sha256').update(body).digest('hex')}`
  );
  expect(result.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
});

it('preserves the registry-provided digest', async () => {
  vi.mocked(axios.get).mockResolvedValue({
    data: '{"schemaVersion":2}',
    headers: { 'docker-content-digest': 'sha256:server-value' },
  });
  expect(
    (await getTagManifestV2({ id: 1, repository: 'test', tag: 'latest' }))
      .digest
  ).toBe('sha256:server-value');
});
