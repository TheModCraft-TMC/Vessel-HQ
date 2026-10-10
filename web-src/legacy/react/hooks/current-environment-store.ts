import { createStore } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';
import type { Environment, EnvironmentId } from '@/domains/environments';

type SelectedEnvironment = Pick<
  Environment,
  'Id' | 'Name' | 'Type' | 'ContainerEngine' | 'SecuritySettings'
>;

export const environmentStore = createStore<{
  environmentId?: number;
  selectedEnvironment?: SelectedEnvironment;
  setEnvironmentId(id: EnvironmentId): void;
  selectEnvironment(environment: Environment): void;
  clear(): void;
}>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        environmentId: undefined,
        selectedEnvironment: undefined,
        setEnvironmentId: (id: EnvironmentId) =>
          set((state) => ({
            environmentId: id,
            selectedEnvironment:
              state.selectedEnvironment?.Id === id
                ? state.selectedEnvironment
                : undefined,
          })),
        selectEnvironment: (environment: Environment) =>
          set({
            environmentId: environment.Id,
            selectedEnvironment: {
              Id: environment.Id,
              Name: environment.Name,
              Type: environment.Type,
              ContainerEngine: environment.ContainerEngine,
              SecuritySettings: environment.SecuritySettings,
            },
          }),
        clear: () =>
          set({ environmentId: undefined, selectedEnvironment: undefined }),
      }),
      {
        name: keyBuilder('environmentId'),
        getStorage: () => sessionStorage,
      }
    )
  )
);
