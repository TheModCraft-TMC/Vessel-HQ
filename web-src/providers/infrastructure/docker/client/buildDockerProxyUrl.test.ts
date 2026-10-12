import { describe, expect, it } from 'vitest';

import { buildDockerProxyUrl } from '../index';

describe('buildDockerProxyUrl', () => {
  it('builds an environment-scoped Docker Engine URL', () => {
    expect(buildDockerProxyUrl(12, 'version')).toBe(
      '/endpoints/12/docker/version'
    );
  });

  it('omits empty optional path segments', () => {
    expect(
      buildDockerProxyUrl(
        12,
        'services',
        undefined,
        'service-id',
        null,
        'update'
      )
    ).toBe('/endpoints/12/docker/services/service-id/update');
  });
});
