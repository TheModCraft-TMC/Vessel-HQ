export {
  awsEcrProvider,
  azureAcrProvider,
  dockerHubProvider,
  ghcrProvider,
  ociRemoteProvider,
  quayProvider,
} from '@/providers/remotes';
export type {
  OciRemoteProvider,
  RemoteRegistryCapabilities,
} from '@/providers/remotes';
export { createRemoteProviders } from './createRemoteProviders';
export type { RemoteProviders } from './types';
