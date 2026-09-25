export function navigate(
  stateService: {
    go: (state: string, params?: unknown, options?: unknown) => unknown;
  },
  state: string,
  params?: unknown,
  options?: unknown
) {
  return stateService.go(state, params, options);
}

export { registerTransitionHandlers } from './transition-handlers';
