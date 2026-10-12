import { describe, expect, it, vi } from 'vitest';

import type { DockerHttpTransport } from '@/providers/infrastructure/docker';

import { createInfrastructureProviders } from './createInfrastructureProviders';

describe('createInfrastructureProviders', () => {
  it('composes concrete Docker-compatible, Kubernetes, Azure, and Edge adapters', () => {
    const http: DockerHttpTransport = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    const kubernetesHttp = {
      ...http,
      put: vi.fn(),
      patch: vi.fn(),
    };

    const providers = createInfrastructureProviders(
      http,
      (error) => (error instanceof Error ? error : new Error('request failed')),
      kubernetesHttp
    );

    expect(providers.docker).toBeDefined();
    expect(providers.podman).toBeDefined();
    expect(providers.podman.listContainers).toBe(
      providers.docker.listContainers
    );
    expect(providers.kubernetes).toEqual(
      expect.objectContaining({
        getVersion: expect.any(Function),
        listNamespaces: expect.any(Function),
      })
    );
    expect(providers.azureAci).toBeDefined();
    expect(providers.edgeAgent).toEqual({
      supportsWaitingRoom: true,
      supportsDeploymentScripts: true,
      supportsConnectivityTest: true,
    });
  });
});
