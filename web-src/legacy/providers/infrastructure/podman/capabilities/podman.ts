export interface PodmanCapabilities {
  engine: 'podman' | 'docker';
  defaultNetworkName: string;
  supportsContainerNetworkMode: boolean;
  supportsRecreate: boolean;
  supportsContainerStats: boolean;
  systemPluginsOnly: boolean;
}

export function getPodmanCapabilities(environment: {
  ContainerEngine?: unknown;
}): PodmanCapabilities {
  const isPodman = environment.ContainerEngine === 'podman';

  return {
    engine: isPodman ? 'podman' : 'docker',
    defaultNetworkName: isPodman ? 'podman' : 'bridge',
    supportsContainerNetworkMode: !isPodman,
    supportsRecreate: !isPodman,
    supportsContainerStats: !isPodman,
    systemPluginsOnly: isPodman,
  };
}
