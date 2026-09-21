import { Suspense, useSyncExternalStore } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { UIRouter, UIView, useCurrentStateAndParams } from '@uirouter/react';

import { AppShell } from '@/ui';
import { queryClient } from '@/core/query/query-client';
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
            <ApplicationShell />
          </Suspense>
        </SidebarProvider>
      </UIRouter>
    </QueryClientProvider>
  );
}

function ApplicationShell() {
  const { state } = useCurrentStateAndParams();
  const { isOpen, toggle } = useSidebarState();
  const stateName = state.name || '';
  const sidebarVisible = !NO_SIDEBAR_STATES.some((name) =>
    stateName.startsWith(name)
  );

  return (
    <AppShell
      content={<UIView name="content" />}
      sidebar={<UIView name="sidebar" />}
      sidebarVisible={sidebarVisible}
      sidebarOpen={isOpen}
      onCloseSidebar={toggle}
    />
  );
}
