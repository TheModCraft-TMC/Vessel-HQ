import {
  AppType,
  AppDataAccessPolicy,
  DeploymentType,
} from '@/domains/applications/applications/types';
import type { ServiceType } from '@/domains/configuration';

// Constants shared by application model adapters.
export const KubernetesApplicationTypes: Record<AppType, AppType> = {
  Deployment: 'Deployment',
  StatefulSet: 'StatefulSet',
  DaemonSet: 'DaemonSet',
  Pod: 'Pod',
  Helm: 'Helm',
} as const;

export const KubernetesApplicationDeploymentTypes: Record<
  DeploymentType,
  DeploymentType
> = {
  Global: 'Global',
  Replicated: 'Replicated',
} as const;

export const KubernetesApplicationDataAccessPolicies: Record<
  AppDataAccessPolicy,
  AppDataAccessPolicy
> = {
  Isolated: 'Isolated',
  Shared: 'Shared',
} as const;

export const KubernetesApplicationServiceTypes: Record<
  ServiceType,
  ServiceType
> = {
  ClusterIP: 'ClusterIP',
  NodePort: 'NodePort',
  LoadBalancer: 'LoadBalancer',
  ExternalName: 'ExternalName',
} as const;
