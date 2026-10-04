import { ComponentType } from 'react';
import { RouteParamsProvider } from '@console/console/routing/useRouteParams';

export function withLayoutTestRouter<T extends object>(
  Component: ComponentType<T>,
  {
    route = '/',
    stateConfig = [],
  }: { route?: string; stateConfig?: TestStateDeclaration[] } = {}
) {
  const routeParams = stateConfig.find((state) => state.name === route)?.params;

  return function LayoutTestRouter(props: T) {
    return (
      <RouteParamsProvider params={toStringParams(routeParams)}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </RouteParamsProvider>
    );
  };
}

function toStringParams(params?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params || {}).map(([key, value]) => [key, String(value)])
  );
}

type TestStateDeclaration = {
  name: string;
  url?: string;
  component?: ComponentType;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
};
