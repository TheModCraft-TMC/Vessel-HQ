import { ComponentType } from 'react';

import { withReactQuery } from '@/core/query/client/withReactQuery';
import { UserProvider } from '@/react/hooks/useUser';

export function withCurrentUser<T extends object>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <UserProvider>
        <WrappedComponent {...props} />
      </UserProvider>
    );
  }

  WrapperComponent.displayName = `withCurrentUser(${displayName})`;

  // User provider makes a call to the API to get the current user.
  // We need to wrap it with React Query to make that call.
  return withReactQuery(WrapperComponent);
}
