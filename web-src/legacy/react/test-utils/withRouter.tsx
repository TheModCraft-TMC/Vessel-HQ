import { ComponentType } from 'react';
import { RouteParamsProvider } from '@console/console/routing/useRouteParams';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';
import { ApplicationBindingsProvider } from '@/core/composition';

/**
 * A helper function to wrap a component with a UIRouter Provider.
 *
 * should only be used in tests
 */
export function withTestRouter<T extends object>(
  WrappedComponent: ComponentType<T>,
  {
    route = '/',
    stateConfig = [],
  }: { route?: string; stateConfig?: Array<TestStateDeclaration> } = {}
): ComponentType<T> {
  const routeParams = stateConfig.find((state) => state.name === route)?.params;

  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <ApplicationBindingsProvider>
        <TestLayoutProvider>
          <RouteParamsProvider params={toStringParams(routeParams)}>
            <WrappedComponent {...props} />
          </RouteParamsProvider>
        </TestLayoutProvider>
      </ApplicationBindingsProvider>
    );
  }

  WrapperComponent.displayName = `withTestRouter(${displayName})`;

  return WrapperComponent;
}

function toStringParams(params?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params || {}).map(([key, value]) => [key, String(value)])
  );
}

export type TestStateDeclaration = {
  name: string;
  url?: string;
  component?: ComponentType;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
};
