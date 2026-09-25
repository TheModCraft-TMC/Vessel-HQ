import * as dockerRoutes from '@/core/routing/lazy-loading/route-components/docker';
import * as kubernetesRoutes from '@/core/routing/lazy-loading/route-components/kubernetes';
import * as portainerRoutes from '@/core/routing/lazy-loading/route-components/portainer';

import { domainRouteManifests } from './domain-manifests';

describe('routing public API initialization', () => {
  it('initializes lazy route components and manifests without undefined exports', () => {
    for (const routes of [dockerRoutes, kubernetesRoutes, portainerRoutes]) {
      expect(Object.values(routes)).not.toContain(undefined);
    }

    expect(domainRouteManifests).toHaveLength(13);
    expect(
      new Set(domainRouteManifests.map((manifest) => manifest.id)).size
    ).toBe(domainRouteManifests.length);
  });

  it('registers every manifest through its public registration entry point', () => {
    const registeredStates: unknown[] = [];
    const registry = {
      register(state: unknown) {
        registeredStates.push(state);
      },
    };

    for (const manifest of domainRouteManifests) {
      expect(() => manifest.register(registry)).not.toThrow();
    }

    expect(registeredStates.length).toBeGreaterThan(0);
  });
});
