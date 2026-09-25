import type { PodmanCapabilities } from '@/providers/infrastructure/podman';

import { useInfo } from './useDockerSystem';

export function useLoggingPlugins(
  environmentId: number,
  systemOnly: boolean,
  capabilities?: PodmanCapabilities
) {
  const useSystemPlugins =
    systemOnly || capabilities?.systemPluginsOnly === true;
  return useInfo(environmentId, {
    select: (info) => info.Plugins?.Log || [],
    enabled: useSystemPlugins,
  });
}
