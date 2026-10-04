import {
  ContainerConfig,
  HostConfig,
  NetworkingConfig,
} from '@/providers/infrastructure/docker';

export interface CreateContainerRequest extends ContainerConfig {
  HostConfig: HostConfig;
  NetworkingConfig: NetworkingConfig;
}
