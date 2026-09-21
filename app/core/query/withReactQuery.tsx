import { ComponentType } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient as defaultQueryClient } from './query-client';

export function withReactQuery<T extends object>(
  WrappedComponent: ComponentType<T>,
  queryClient = defaultQueryClient
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <QueryClientProvider client={queryClient}>
        <WrappedComponent {...props} />
      </QueryClientProvider>
    );
  }

  WrapperComponent.displayName = `withReactQuery(${displayName})`;

  return WrapperComponent;
}
