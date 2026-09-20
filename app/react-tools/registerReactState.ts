import type { ReactStateDeclaration, StateRegistry } from '@uirouter/react';

/** Register a React view directly with the shared hybrid UI-Router instance. */
export function registerReactState(
  registry: StateRegistry,
  state: ReactStateDeclaration
) {
  return registry.register(state);
}
