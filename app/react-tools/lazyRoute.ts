import { ComponentType, lazy, LazyExoticComponent } from 'react';

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

    return {
      default: module[exportName] as unknown as ComponentType,
    };
  });
}
