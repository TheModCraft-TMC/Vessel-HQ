import type {
  RouteRegistry,
  RouteManifest,
} from '../route-contracts/route-manifest';

export function registerRouteManifests(
  registry: RouteRegistry,
  manifests: RouteManifest[]
) {
  manifests.forEach((manifest) => manifest.register(registry));
}
