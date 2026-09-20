import { ComponentType } from 'react';
import { UIRouterContext } from '@uirouter/react';

import { router } from '@/router';

export function withUIRouter<T extends object>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <UIRouterContext.Provider value={router}>
        <WrappedComponent {...props} />
      </UIRouterContext.Provider>
    );
  }

  WrapperComponent.displayName = `withUIRouter(${displayName})`;

  return WrapperComponent;
}
