import {
  ContainerEngine,
  Environment,
  EnvironmentType,
  PlatformType,
} from '../types';

export function getPlatformType(
  envType: EnvironmentType,
  containerEngine?: ContainerEngine
) {
  switch (envType) {
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
    case EnvironmentType.EdgeAgentOnKubernetes:
      return PlatformType.Kubernetes;
    case EnvironmentType.Docker:
    case EnvironmentType.AgentOnDocker:
    case EnvironmentType.EdgeAgentOnDocker:
      return containerEngine === ContainerEngine.Podman
        ? PlatformType.Podman
        : PlatformType.Docker;
    case EnvironmentType.Azure:
      return PlatformType.Azure;
    default:
      throw new Error(`Environment type ${envType} is not supported`);
  }
}

export function isDockerEnvironment(envType: EnvironmentType) {
  return getPlatformType(envType) === PlatformType.Docker;
}

export function isKubernetesEnvironment(envType: EnvironmentType) {
  return getPlatformType(envType) === PlatformType.Kubernetes;
}

export function getPlatformTypeName(
  envType: EnvironmentType,
  containerEngine?: ContainerEngine
): string {
  return PlatformType[getPlatformType(envType, containerEngine)];
}

export function isSnapshotBrowsingSupported(environment: Environment) {
  return isDockerEnvironment(environment.Type) && isEdgeAsync(environment);
}

export function isAgentEnvironment(envType: EnvironmentType) {
  return (
    isEdgeEnvironment(envType) ||
    [EnvironmentType.AgentOnDocker, EnvironmentType.AgentOnKubernetes].includes(
      envType
    )
  );
}

export function isEdgeEnvironment(envType: EnvironmentType) {
  return [
    EnvironmentType.EdgeAgentOnDocker,
    EnvironmentType.EdgeAgentOnKubernetes,
  ].includes(envType);
}

export function isEdgeAsync(environment?: Environment | null) {
  return !!environment && environment.Edge.AsyncMode;
}

export function isUnassociatedEdgeEnvironment(environment: Environment) {
  return isEdgeEnvironment(environment.Type) && !environment.EdgeID;
}

export function isLocalEnvironment(environment: Environment) {
  return (
    isLocalDockerEnvironment(environment.URL) ||
    environment.Type === EnvironmentType.KubernetesLocal
  );
}

export function isLocalDockerEnvironment(environmentUrl: string) {
  return (
    environmentUrl.startsWith('unix://') ||
    environmentUrl.startsWith('npipe://')
  );
}

export function isDockerAPIEnvironment(environment: Environment) {
  return (
    environment.URL.startsWith('tcp://') &&
    environment.Type === EnvironmentType.Docker
  );
}

export function isAzureEnvironment(envType: EnvironmentType) {
  return envType === EnvironmentType.Azure;
}

export function getDashboardRoute(environment: Environment) {
  if (isEdgeEnvironment(environment.Type)) {
    if (!environment.EdgeID) {
      return {
        to: '/environments/:id',
        params: { id: environment.Id },
      };
    }

    if (isEdgeAsync(environment)) {
      return {
        to: '/:environmentId/docker/dashboard',
        params: { environmentId: environment.Id },
      };
    }
  }

  const params = { endpointId: environment.Id };
  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Azure:
      return { to: '/:endpointId/azure/dashboard', params };
    case PlatformType.Docker:
      return { to: '/:endpointId/docker/dashboard', params };
    case PlatformType.Kubernetes:
      return { to: '/:endpointId/kubernetes/dashboard', params };
    default:
      throw new Error(`Unsupported platform ${platform}`);
  }
}

export function getDockerEnvironmentType(isSwarm: boolean, isPodman?: boolean) {
  if (isPodman) {
    return 'Podman';
  }

  return isSwarm ? 'Swarm' : 'Standalone';
}
