export { awsEcrProvider } from '@/providers/remotes/aws-ecr';
export { azureAcrProvider } from '@/providers/remotes/azure-acr';
export { dockerHubProvider } from '@/providers/remotes/docker-hub';
export { ghcrProvider } from '@/providers/remotes/ghcr';
export { ociRemoteProvider } from '@/providers/remotes/oci';
export { quayProvider } from '@/providers/remotes/quay';
export type {
  OciBlobRequest,
  OciManifestRequest,
  OciRegistryReference,
  OciRemoteProvider,
  RemoteRegistryCapabilities,
} from '@/providers/remotes/oci';
