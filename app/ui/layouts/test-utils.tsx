import { ComponentType } from 'react';
import {
  ReactStateDeclaration,
  UIRouter,
  UIRouterReact,
  UIView,
  hashLocationPlugin,
  servicesPlugin,
} from '@uirouter/react';

export function withLayoutTestRouter<T extends object>(
  Component: ComponentType<T>,
  {
    route = '/',
    stateConfig = [],
  }: { route?: string; stateConfig?: ReactStateDeclaration[] } = {}
) {
  const router = new UIRouterReact();
  router.plugin(servicesPlugin);
  router.plugin(hashLocationPlugin);
  stateConfig.forEach((state) => router.stateRegistry.register(state));
  router.urlService.rules.initial({ state: route });

  return function LayoutTestRouter(props: T) {
    return (
      <UIRouter router={router}>
        <UIView />
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </UIRouter>
    );
  };
}
