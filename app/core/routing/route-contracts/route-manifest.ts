export interface RouteRegistry {
  register(state: unknown): unknown;
}

export interface RouteManifest {
  id: string;
  register(registry: RouteRegistry): void;
}

export function createRouteManifest(
  id: string,
  register: (registry: RouteRegistry) => void
): RouteManifest {
  return { id, register };
}
