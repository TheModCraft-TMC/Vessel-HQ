import type { ReactStateDeclaration } from '@uirouter/react';

import type { RouteRegistry } from './route-contracts';

/** Register a React view directly with the shared hybrid UI-Router instance. */
export function registerReactState(
  registry: RouteRegistry,
  state: ReactStateDeclaration
) {
  return registry.register(state);
}
