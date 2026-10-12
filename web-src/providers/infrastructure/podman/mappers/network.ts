import type { PodmanCapabilities } from '../capabilities/podman';

export function mapDefaultNetworkName(capabilities: PodmanCapabilities) {
  return capabilities.defaultNetworkName;
}
