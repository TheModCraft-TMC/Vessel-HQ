import { RegistryTypes } from '@/domains/registries/models/registry';
import {
  awsEcrProvider,
  azureAcrProvider,
  dockerHubProvider,
  ghcrProvider,
  ociRemoteProvider,
  quayProvider,
  type OciRemoteProvider,
} from '@/providers/remotes';

/** Composition boundary for registry transports. Views consume this capability, not provider branches. */
export function getRemoteProvider(type: RegistryTypes): OciRemoteProvider {
  switch (type) {
    case RegistryTypes.DOCKERHUB:
      return dockerHubProvider;
    case RegistryTypes.GITHUB:
      return ghcrProvider;
    case RegistryTypes.ECR:
      return awsEcrProvider;
    case RegistryTypes.AZURE:
      return azureAcrProvider;
    case RegistryTypes.QUAY:
      return quayProvider;
    default:
      return ociRemoteProvider;
  }
}
