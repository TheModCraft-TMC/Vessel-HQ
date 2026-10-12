import {
  PortainerEndpoint,
  PortainerEnvironmentEdgeSettings,
  PortainerKubernetesData,
  PortainerKubernetesStorageClassConfig,
} from '@api/types.gen';

import {
  ContainerEngine,
  Environment,
  EnvironmentEdge,
  EnvironmentStatus,
  EnvironmentType,
  KubernetesSettings,
  StorageClass,
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../types';

export function toEnvironment(endpoint: PortainerEndpoint): Environment {
  return {
    ...endpoint,
    Type: endpoint.Type || EnvironmentType.Docker,
    Status: endpoint.Status ?? EnvironmentStatus.Down,
    ContainerEngine: toContainerEngine(endpoint.ContainerEngine),
    TagIds: endpoint.TagIds ?? [],
    Gpus: endpoint.Gpus ?? [],
    EnableGPUManagement: endpoint.EnableGPUManagement ?? false,
    Snapshots:
      endpoint.Snapshots?.map((snapshot) => ({
        ...snapshot,
        GpuUseList: snapshot.GpuUseList ?? [],
      })) || [],
    Agent: { Version: endpoint.Agent?.Version || '', IsOutdated: false },
    Edge: toEdge(endpoint.Edge),
    Kubernetes: toKubernetesSettings(endpoint.Kubernetes),
    TeamAccessPolicies: toAccessPolicies(endpoint.TeamAccessPolicies),
    UserAccessPolicies: toAccessPolicies(endpoint.UserAccessPolicies),
    ChangeWindow: { Enabled: false, EndTime: '', StartTime: '' },
    DeploymentOptions: {
      hideAddWithForm: false,
      hideFileUpload: false,
      hideWebEditor: false,
      overrideGlobalOptions: false,
    },
    EnableImageNotification: false,
  };
}

function toAccessPolicies(
  policies?: Record<string, { RoleId?: number; Namespaces?: string[] }>
): UserAccessPolicies | TeamAccessPolicies | undefined {
  if (!policies) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(policies).map(([id, policy]) => [
      id,
      { RoleId: policy.RoleId ?? 0, Namespaces: policy.Namespaces },
    ])
  );
}

function toKubernetesSettings(
  data: PortainerKubernetesData
): KubernetesSettings {
  return {
    ...data,
    Configuration: {
      ...data.Configuration,
      StorageClasses:
        data.Configuration?.StorageClasses?.map(toStorageClass) ?? [],
      IngressClasses: data.Configuration?.IngressClasses ?? [],
    },
  };
}

function toStorageClass(
  original: PortainerKubernetesStorageClassConfig
): StorageClass {
  return { ...original, AccessModes: original.AccessModes ?? [] };
}

function toContainerEngine(engine: string): ContainerEngine {
  switch (engine) {
    case ContainerEngine.Podman:
      return ContainerEngine.Podman;
    case '':
      return ContainerEngine.Kubernetes;
    default:
      return ContainerEngine.Docker;
  }
}

function toEdge(edge?: PortainerEnvironmentEdgeSettings): EnvironmentEdge {
  return {
    AsyncMode: edge?.AsyncMode ?? false,
    PingInterval: edge?.PingInterval ?? 0,
    SnapshotInterval: edge?.SnapshotInterval ?? 0,
    CommandInterval: edge?.CommandInterval ?? 0,
  };
}
