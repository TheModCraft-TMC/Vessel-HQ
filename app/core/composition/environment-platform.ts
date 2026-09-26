import { PlatformType } from '@/domains/environments';
import type { LayoutEnvironment } from '@/ui/layouts/layout-context';

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
