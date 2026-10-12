import { ociRemoteProvider } from '@/providers/remotes/oci';

export const azureAcrProvider = {
  ...ociRemoteProvider,
  capabilities: {
    ...ociRemoteProvider.capabilities,
    supportsAuthentication: true,
  },
};
