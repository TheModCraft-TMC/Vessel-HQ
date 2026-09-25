import type { OciRemoteProvider } from '@/providers/remotes/oci';

export interface RemoteProviders {
  oci: OciRemoteProvider;
  dockerHub: OciRemoteProvider;
  ghcr: OciRemoteProvider;
  awsEcr: OciRemoteProvider;
  azureAcr: OciRemoteProvider;
  quay: OciRemoteProvider;
}
