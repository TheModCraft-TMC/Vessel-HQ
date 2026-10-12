import type { LayoutEnvironment } from '@console/layout/LayoutContext';

import { PlatformType } from '@/domains/environments';

const layoutPlatformByType: Record<
  PlatformType,
  LayoutEnvironment['platform']
> = {
  [PlatformType.Docker]: 'docker',
  [PlatformType.Kubernetes]: 'kubernetes',
  [PlatformType.Azure]: 'azure',
  [PlatformType.Podman]: 'podman',
};

export function toLayoutPlatform(platform: PlatformType) {
  return layoutPlatformByType[platform];
}
