import { ociRemoteProvider } from '@/providers/remotes/oci';

export const ghcrProvider = {
  ...ociRemoteProvider,
  capabilities: {
    ...ociRemoteProvider.capabilities,
    fixedUrl: true,
    supportsOrganization: true,
  },
};
