import { PlatformType } from '@/domains/environments';

import { toLayoutPlatform } from './environment-platform';

describe('toLayoutPlatform', () => {
  it.each([
    [PlatformType.Docker, 'docker'],
    [PlatformType.Kubernetes, 'kubernetes'],
    [PlatformType.Azure, 'azure'],
    [PlatformType.Podman, 'podman'],
  ] as const)('maps %s to %s', (platform, expected) => {
    expect(toLayoutPlatform(platform)).toBe(expected);
  });
});
