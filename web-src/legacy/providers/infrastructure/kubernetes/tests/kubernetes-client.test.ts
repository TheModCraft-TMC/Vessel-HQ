import { describe, expect, it, vi } from 'vitest';

import { createKubernetesClient } from '../client/kubernetes-client';

describe('kubernetes provider client', () => {
  it('maps version and namespaces at the provider boundary', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: { gitVersion: 'v1.31.0' } })
      .mockResolvedValueOnce({ data: [{ Name: 'default', IsDefault: true }] });
    const client = createKubernetesClient({ get });

    await expect(client.getVersion(7)).resolves.toMatchObject({
      gitVersion: 'v1.31.0',
      supportsPodRestart: false,
    });
    await expect(client.listNamespaces(7)).resolves.toMatchObject([
      { Name: 'default', IsDefault: true, Id: 'default' },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, '/kubernetes/7/version', {
      params: undefined,
    });
  });

  it('adds watch semantics to native resource requests', async () => {
    const get = vi.fn().mockResolvedValue({ data: { kind: 'PodList' } });
    const client = createKubernetesClient({ get });

    await client.watch(7, 'api/v1/namespaces/default/pods', {
      resourceVersion: '42',
    });

    expect(get).toHaveBeenCalledWith(
      '/endpoints/7/kubernetes/api/v1/namespaces/default/pods',
      { params: { resourceVersion: '42', watch: true } }
    );
  });
});
