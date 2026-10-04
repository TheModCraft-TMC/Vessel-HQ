import { ociRemoteProvider } from '@/providers/remotes/oci';

export const dockerHubProvider = {
  ...ociRemoteProvider,
  capabilities: { ...ociRemoteProvider.capabilities, fixedUrl: true },
};
