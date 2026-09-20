import { Suspense, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { UIRouter, UIView, useCurrentStateAndParams } from '@uirouter/react';

import { queryClient } from '@/react-tools/react-query';
import {
  SidebarProvider,
  useSidebarState,
} from '@/react/sidebar/useSidebarState';

import { router } from './router';

const NO_SIDEBAR_STATES = [
  'portainer.auth',
  'portainer.init.admin',
  'portainer.init.edge',
  'portainer.logout',
  'kubernetes.kubectlshell',
];

export function VesselLoadingShell() {
  return (
    <div className="vessel-ssr-shell" role="status" aria-live="polite">
      <div className="vessel-ssr-brand">Vessel HQ</div>
      <div className="vessel-ssr-loading">Loading Vessel HQ…</div>
    </div>
  );
}

export function ClientApp() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!hydrated) {
    return <VesselLoadingShell />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UIRouter router={router}>
        <SidebarProvider>
          <Suspense fallback={<VesselLoadingShell />}>
            <AppShell />
          </Suspense>
        </SidebarProvider>
      </UIRouter>
    </QueryClientProvider>
  );
}

function AppShell() {
  const { state } = useCurrentStateAndParams();
  const { isOpen } = useSidebarState();
  const stateName = state.name || '';
  const hidesSidebar = NO_SIDEBAR_STATES.some((name) =>
    stateName.startsWith(name)
  );

  return (
    <div
      id="page-wrapper"
      className={clsx({
        open: isOpen && !hidesSidebar,
        nopadding: hidesSidebar,
      })}
    >
      {!hidesSidebar && (
        <aside id="sideview" aria-label="Primary navigation">
          <UIView name="sidebar" />
        </aside>
      )}

      <div id="content-wrapper">
        <main className="page-content">
          <div id="view">
            <UIView name="content" />
          </div>
        </main>
      </div>
    </div>
  );
}
