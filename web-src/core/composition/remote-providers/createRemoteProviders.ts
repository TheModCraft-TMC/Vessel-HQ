import {
  awsEcrProvider,
  azureAcrProvider,
  dockerHubProvider,
  ghcrProvider,
  ociRemoteProvider,
  quayProvider,
} from '@/providers/remotes';

import type { RemoteProviders } from './types';

export function createRemoteProviders(): RemoteProviders {
  return {
    oci: ociRemoteProvider,
    dockerHub: dockerHubProvider,
    ghcr: ghcrProvider,
    awsEcr: awsEcrProvider,
    azureAcr: azureAcrProvider,
    quay: quayProvider,
  };
}
