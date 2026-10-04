import { EnvironmentId, useEnvironment } from '@/domains/environments';

import {
  getPodmanCapabilities,
  type PodmanCapabilities,
} from './podman';

const dockerCapabilities = getPodmanCapabilities({});

/** Resolves engine-specific capability flags for a configured environment. */
export function usePodmanCapabilities(
  environmentId?: EnvironmentId
): PodmanCapabilities {
  const query = useEnvironment<PodmanCapabilities>(
    environmentId,
    getPodmanCapabilities
  );
  return query.data || dockerCapabilities;
}
