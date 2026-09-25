import type {
  EnvironmentCapabilities,
  EnvironmentDescriptor,
} from '../capabilities';
import type { InfrastructureProviders } from '../infrastructure-providers';
import type { RemoteProviders } from '../remote-providers';

export interface ApplicationBindings {
  infrastructure: InfrastructureProviders;
  remotes: RemoteProviders;
  capabilities: {
    forEnvironment(environment: EnvironmentDescriptor): EnvironmentCapabilities;
  };
}
