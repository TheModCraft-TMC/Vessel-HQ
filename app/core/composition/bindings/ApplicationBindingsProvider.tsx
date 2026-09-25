import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import http, { parseAxiosError } from '@/shared/http';

import {
  createApplicationBindings,
  type CompositionDependencies,
} from './createApplicationBindings';
import type { ApplicationBindings } from './types';

const ApplicationBindingsContext = createContext<ApplicationBindings | null>(
  null
);

export function ApplicationBindingsProvider({
  children,
  dependencies,
}: PropsWithChildren<{ dependencies?: Partial<CompositionDependencies> }>) {
  const bindings = useMemo(
    () =>
      createApplicationBindings({
        http: (dependencies?.http ?? http) as CompositionDependencies['http'],
        normalizeError: dependencies?.normalizeError ?? parseAxiosError,
        kubernetesHttp: dependencies?.kubernetesHttp ?? http,
      }),
    [dependencies]
  );

  return (
    <ApplicationBindingsContext.Provider value={bindings}>
      {children}
    </ApplicationBindingsContext.Provider>
  );
}

export function useApplicationBindings() {
  const bindings = useContext(ApplicationBindingsContext);

  if (!bindings) {
    throw new Error(
      'useApplicationBindings must be used inside ApplicationBindingsProvider'
    );
  }

  return bindings;
}
