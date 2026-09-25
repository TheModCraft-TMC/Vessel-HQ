import {
  Registry,
  RegistryTypes,
} from '@/domains/registries';

export function getIsDockerHubRegistry(registry?: Registry | null) {
  return (
    !registry ||
    registry.Type === RegistryTypes.DOCKERHUB ||
    registry.Type === RegistryTypes.ANONYMOUS
  );
}
