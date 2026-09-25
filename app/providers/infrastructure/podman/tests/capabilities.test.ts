import { describe, expect, it } from 'vitest';

import { getPodmanCapabilities } from '../capabilities/podman';

describe('getPodmanCapabilities', () => {
  it('adapts Podman differences', () => {
    expect(getPodmanCapabilities({ ContainerEngine: 'podman' })).toEqual({
      engine: 'podman',
      defaultNetworkName: 'podman',
      supportsContainerNetworkMode: false,
      supportsRecreate: false,
      supportsContainerStats: false,
      systemPluginsOnly: true,
    });
  });

  it('keeps Docker compatible behavior as the default', () => {
    expect(
      getPodmanCapabilities({ ContainerEngine: 'docker' }).supportsRecreate
    ).toBe(true);
  });
});
