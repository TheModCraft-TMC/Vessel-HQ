import { Suspense, useSyncExternalStore } from 'react';
import { UIRouter, UIView, useCurrentStateAndParams } from '@uirouter/react';

import { AuthenticatedLayout, PublicLayout } from '@/ui';
import {
  ApplicationBindingsProvider,
  LayoutBindingsProvider,
} from '@/core/composition';
import { QueryProvider } from '@/core/query';
import { SidebarProvider } from '@/ui/layouts/mobile-navigation/useSidebarState';

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
    <QueryProvider>
      <UIRouter router={router}>
        <ApplicationBindingsProvider>
          <LayoutBindingsProvider>
            <SidebarProvider>
              <Suspense fallback={<VesselLoadingShell />}>
                <ApplicationShell />
              </Suspense>
            </SidebarProvider>
          </LayoutBindingsProvider>
        </ApplicationBindingsProvider>
      </UIRouter>
    </QueryProvider>
  );
}

function ApplicationShell() {
  const { state } = useCurrentStateAndParams();
  const stateName = state.name || '';
  const sidebarVisible = !NO_SIDEBAR_STATES.some((name) =>
    stateName.startsWith(name)
  );

  if (!sidebarVisible) {
    return <PublicLayout content={<UIView name="content" />} />;
  }

  return (
    <AuthenticatedLayout
      content={<UIView name="content" />}
      sidebar={<UIView name="sidebar" />}
    />
  );
}
