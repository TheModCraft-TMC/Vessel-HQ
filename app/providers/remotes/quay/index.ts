import { ociRemoteProvider } from '@/providers/remotes/oci';

export const quayProvider = {
  ...ociRemoteProvider,
  capabilities: {
    ...ociRemoteProvider.capabilities,
    fixedUrl: true,
    supportsOrganization: true,
  },
};
