import { Resources, RestartPolicy } from '@/providers/infrastructure/docker';
import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

/**
 * UpdateConfig holds the mutable attributes of a Container.
 * Those attributes can be updated at runtime.
 */
interface UpdateConfig extends Resources {
  // Contains container's resources (cgroups, ulimits)
  RestartPolicy?: RestartPolicy;
}

/**
 * Raw docker API proxy
 */
export async function updateContainer(
  environmentId: EnvironmentId,
  containerId: string,
  config: UpdateConfig,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.updateContainer(environmentId, containerId, config, {
    nodeName,
  });
}
