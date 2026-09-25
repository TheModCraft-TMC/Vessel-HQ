import type { TransitionService } from '@uirouter/react';

export function registerTransitionHandlers(
  transitionService: TransitionService,
  handlers: { onBefore?: () => void }
) {
  transitionService.onBefore({}, () => {
    handlers.onBefore?.();
  });
}
