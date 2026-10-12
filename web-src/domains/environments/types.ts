import { TagId } from '@/domains/tags';

import { DockerSnapshot } from './models/snapshot';
import type { SortType } from './queries/useEnvironmentList';

export type EnvironmentGroupId = number;

export type EdgeGroupId = number;

type RoleId = number;
interface AccessPolicy {
  RoleId: RoleId;
  Namespaces?: string[];
}

export type UserAccessPolicies = Record<number, AccessPolicy>; // map[UserID]AccessPolicy
export type TeamAccessPolicies = Record<number, AccessPolicy>;

export type EnvironmentId = number;

/**
 * matches portainer.EndpointType in app/portainer.go
 */
export enum EnvironmentType {
  // Docker represents an environment(endpoint) connected to a Docker environment(endpoint)
  Docker = 1,
  // AgentOnDocker represents an environment(endpoint) connected to a Portainer agent deployed on a Docker environment(endpoint)
  AgentOnDocker,
  // Azure represents an environment(endpoint) connected to an Azure environment(endpoint)
  Azure,
  // EdgeAgentOnDocker represents an environment(endpoint) connected to an Edge agent deployed on a Docker environment(endpoint)
  EdgeAgentOnDocker,
  // KubernetesLocal represents an environment(endpoint) connected to a local Kubernetes environment(endpoint)
  KubernetesLocal,
  // AgentOnKubernetes represents an environment(endpoint) connected to a Portainer agent deployed on a Kubernetes environment(endpoint)
  AgentOnKubernetes,
  // EdgeAgentOnKubernetes represents an environment(endpoint) connected to an Edge agent deployed on a Kubernetes environment(endpoint)
  EdgeAgentOnKubernetes,
}

export const EdgeTypes = [
  EnvironmentType.EdgeAgentOnDocker,
  EnvironmentType.EdgeAgentOnKubernetes,
] as const;

export enum EnvironmentStatus {
  Up = 1,
  Down,
  Provisioning,
  Error,
}

export interface KubernetesSnapshot {
  KubernetesVersion: string;
  TotalCPU: number;
  TotalMemory: number;
  Time: number;
  NodeCount: number;
  GPUNodeCount?: number;
  TotalGPU?: Record<string, number>;
}

export type IngressClass = {
  Name: string;
  Type: string;
  Blocked?: boolean;
  BlockedNamespaces?: string[];
};

export interface StorageClass {
  Name: string;
  AccessModes: string[];
  AllowVolumeExpansion: boolean;
  Provisioner: string;
}

export interface KubernetesConfiguration {
  UseLoadBalancer?: boolean;
  StorageClasses?: StorageClass[];
  UseServerMetrics?: boolean;
  EnableResourceOverCommit?: boolean;
  ResourceOverCommitPercentage?: number;
  RestrictDefaultNamespace?: boolean;
  RestrictSecrets?: boolean;
  RestrictStandardUserIngressW?: boolean;
  IngressClasses: IngressClass[];
  IngressAvailabilityPerNamespace: boolean;
  AllowNoneIngressClass: boolean;
}

export interface KubernetesSettings {
  Snapshots?: KubernetesSnapshot[];
  Configuration: KubernetesConfiguration;
  Flags: {
    IsServerMetricsDetected: boolean;
    IsServerIngressClassDetected: boolean;
    IsServerStorageDetected: boolean;
  };
}

export type EnvironmentEdge = {
  AsyncMode: boolean;
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
};

export interface EnvironmentSecuritySettings {
  allowBindMountsForRegularUsers: boolean;
  allowContainerCapabilitiesForRegularUsers: boolean;
  allowDeviceMappingForRegularUsers: boolean;
  allowHostNamespaceForRegularUsers: boolean;
  allowPrivilegedModeForRegularUsers: boolean;
  allowSecurityOptForRegularUsers: boolean;
  allowStackManagementForRegularUsers: boolean;
  allowSysctlSettingForRegularUsers: boolean;
  allowVolumeBrowserForRegularUsers: boolean;
  enableHostManagementFeatures: boolean;
}

export interface EnvironmentTlsConfig {
  TLS: boolean;
  TLSCACert?: string;
  TLSCert?: string;
  TLSKey?: string;
  TLSSkipVerify: boolean;
}

export interface EnvironmentGpu {
  name: string;
  value: string;
}

export interface AzureCredentials {
  ApplicationID: string;
  AuthenticationKey: string;
  TenantID: string;
}

export type DeploymentOptions = {
  overrideGlobalOptions: boolean;
  hideAddWithForm: boolean;
  hideWebEditor: boolean;
  hideFileUpload: boolean;
};

/**
 *  EndpointChangeWindow determine when GitOps stack/app updates may occur
 */
export interface EndpointChangeWindow {
  Enabled: boolean;
  StartTime: string;
  EndTime: string;
}
export interface EnvironmentStatusMessage {
  summary: string;
  detail: string;
}

export interface Environment {
  Agent: { Version: string; IsOutdated?: boolean };
  AzureCredentials?: AzureCredentials;
  ComposeSyntaxMaxVersion: string;
  ContainerEngine: ContainerEngine;
  Edge: EnvironmentEdge;
  EdgeCheckinInterval: number;
  EdgeID?: string;
  EdgeKey: string;
  EnableGPUManagement: boolean;
  Gpus: EnvironmentGpu[];
  GroupId: number;
  Heartbeat?: boolean;
  Id: number;
  Kubernetes: KubernetesSettings;
  LastCheckInDate: number;
  Name: string;
  PublicURL: string;
  SecuritySettings: EnvironmentSecuritySettings;
  TLSConfig: EnvironmentTlsConfig;
  TagIds: TagId[];
  TeamAccessPolicies?: TeamAccessPolicies;
  Type: EnvironmentType;
  URL: string;
  UserAccessPolicies?: UserAccessPolicies;
  UserTrusted?: boolean;
  Status: EnvironmentStatus;
  Snapshots: DockerSnapshot[];

  // Fields supplied by the enterprise server.
  LocalTimeZone?: string;
  EnableImageNotification: boolean;
  ChangeWindow: EndpointChangeWindow;
  DeploymentOptions: DeploymentOptions | null;
  StatusMessage?: EnvironmentStatusMessage;
}

/**
 * TS reference of endpoint_create.go#EndpointCreationType iota
 */
export enum EnvironmentCreationTypes {
  LocalDockerEnvironment = 1,
  AgentEnvironment,
  AzureEnvironment,
  EdgeAgentEnvironment,
  LocalKubernetesEnvironment,
  KubeConfigEnvironment,
}

export enum ContainerEngine {
  Docker = 'docker',
  Podman = 'podman',
  // an empty container engine means that the endpoint is a Kubernetes endpoint
  Kubernetes = '',
}

export enum PlatformType {
  Docker,
  Kubernetes,
  Azure,
  Podman,
}

export enum EnvironmentHealth {
  Down,
  Outdated,
  Up,
  Heartbeat,
}

export interface HomeViewTableState {
  search: string;
  setSearch(value: string): void;
  sortBy?: { id: string; desc: boolean };
  setSortBy(id: string | undefined, desc: boolean): void;
  groupBy: string | null;
  setGroupBy(group: string | null): void;
  groupFilter: string | null;
  setGroupFilter(value: { group: string; groupValue: string | null }): void;
  page: number;
  setPage(page: number): void;
  pageSize: number;
  setPageSize(size: number): void;
  groupKey: SortType;
  setHeaderFilter(sortBy: SortType, filter: string | null): void;
}
