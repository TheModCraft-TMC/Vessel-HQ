import { Suspense, useSyncExternalStore } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { UIRouter } from '@uirouter/react';

import { AppShell } from '@/layouts/AppShell';
import { queryClient } from '@/core/query/query-client';
import { SidebarProvider } from '@/react/sidebar/useSidebarState';

import { router } from './router';

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
