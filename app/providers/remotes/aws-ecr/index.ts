import { ociRemoteProvider } from '@/providers/remotes/oci';

export const awsEcrProvider = {
  ...ociRemoteProvider,
  capabilities: { ...ociRemoteProvider.capabilities, requiresRegion: true },
};
