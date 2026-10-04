import { CreateContainerRequest } from '@/domains/containers/views/ContainerCreateView/types';

import { capabilities } from './types';
import { Values } from './CapabilitiesTab';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values,
  hideCapabilities: boolean
): CreateContainerRequest {
  return {
    ...oldConfig,
    HostConfig: {
      ...oldConfig.HostConfig,
      CapAdd: hideCapabilities ? [] : values,
      CapDrop: hideCapabilities
        ? []
        : capabilities
            .filter((cap) => !values.includes(cap.key))
            .map((cap) => cap.key),
    },
  };
}
