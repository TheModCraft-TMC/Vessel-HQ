import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { usePodmanCapabilities } from '@/providers/infrastructure/podman';
import { useNetworks, type DockerNetwork } from '@/domains/networks';

import { useApiVersion, useIsSwarm } from '../hooks/useDockerSystem';

export function useNetworksForSelector<T = DockerNetwork[]>({
  select,
}: {
  select?(networks: Array<DockerNetwork>): T;
} = {}) {
  const environmentId = useEnvironmentId();
  const isSwarmQuery = useIsSwarm(environmentId);
  const dockerApiVersion = useApiVersion(environmentId);

  return useNetworks(
    environmentId,
    {
      local: true,
      swarmAttachable: isSwarmQuery && dockerApiVersion >= 1.25,
    },
    { select }
  );
}

export function useNetworkSelectorCapabilities() {
  return usePodmanCapabilities(useEnvironmentId());
}
