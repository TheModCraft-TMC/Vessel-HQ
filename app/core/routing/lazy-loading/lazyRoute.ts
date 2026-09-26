import { ComponentType, createElement, lazy, LazyExoticComponent } from 'react';

/**
 * Lazily loads a named route component so it does not become part of the
 * initial application bundle. Route modules use named exports throughout the
 * codebase, while React.lazy expects a default export.
 */
export function lazyRoute<TModule extends object>(
  load: () => Promise<TModule>,
  exportName: keyof TModule
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const module = await load();
    const ExportedComponent = module[exportName] as unknown as ComponentType;

    // Some domain barrels expose routes that are already lazy. Returning that
    // value directly would create a nested React.lazy payload, which React 19
    // rejects. A component boundary supports both eager and lazy exports.
    function RouteComponent(props: object) {
      return createElement(ExportedComponent, props);
    }

    return {
      default: RouteComponent,
    };
  });
}
