import { describe, expect, it, vi } from 'vitest';

import { createKubernetesResourceClient } from '../client/resource-client';

describe('kubernetes resource client', () => {
  it('forwards typed requests through the configured transport', async () => {
    const transport = {
      get: vi.fn().mockResolvedValue({ data: { items: ['service'] } }),
      post: vi.fn().mockResolvedValue({ data: { deleted: true } }),
    };
    const client = createKubernetesResourceClient(transport);

    await expect(
      client.get<{ items: string[] }>('kubernetes/7/services', {
        params: { withApplications: true },
      })
    ).resolves.toEqual({ items: ['service'] });
    await expect(
      client.post<{ deleted: boolean }>('kubernetes/7/services/delete', {
        default: ['api'],
      })
    ).resolves.toEqual({ deleted: true });

    expect(transport.get).toHaveBeenCalledWith('kubernetes/7/services', {
      params: { withApplications: true },
    });
    expect(transport.post).toHaveBeenCalledWith(
      'kubernetes/7/services/delete',
      { default: ['api'] },
      undefined
    );
  });

  it('normalizes transport errors at the provider boundary', async () => {
    const client = createKubernetesResourceClient({
      get: vi.fn().mockRejectedValue(new Error('network failure')),
    });

    await expect(
      client.get(
        'kubernetes/7/services',
        undefined,
        'Unable to retrieve services'
      )
    ).rejects.toThrow('Unable to retrieve services');
  });
});
