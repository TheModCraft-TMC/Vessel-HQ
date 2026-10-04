import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { DockerNetworkCreateRequest } from '@/providers/infrastructure/docker';

type MacvlanConfigOnly = {
  ConfigOnly: true;
  Internal: false;
  Attachable: false;
  Options: {
    parent: string; // parent network card
  };
};

type MacvlanConfigFrom = {
  ConfigFrom: {
    Network: string;
  };
  Scope: 'swarm' | 'local';
};

type NetworkConfigBase = DockerNetworkCreateRequest;

/**
 * This type definition of NetworkConfig doesnt enforce the usage of only one type of the union
 * and not a mix of fields of the unionised types.
 * e.g. the following is valid for TS while it is not for the Docker API
 *
 * const config: NetworkConfig = {
 *   Name: 'my-network', // shared
 *   ConfigOnly: true, // MacvlanConfigOnly
 *   Scope: 'swarm', // MacvlanConfigFrom
 * }
 *
 */
type NetworkConfig =
  | NetworkConfigBase
  | (NetworkConfigBase & MacvlanConfigOnly)
  | (NetworkConfigBase & MacvlanConfigFrom);

type CreateOptions = {
  nodeName?: string;
  agentManagerOperation?: boolean;
};

export async function createNetwork(
  environmentId: EnvironmentId,
  networkConfig: NetworkConfig,
  { nodeName, agentManagerOperation }: CreateOptions = {}
) {
  return dockerClient.createNetwork(environmentId, networkConfig, {
    nodeName,
    agentManagerOperation,
  });
}
