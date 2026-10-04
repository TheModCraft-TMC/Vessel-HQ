'use client';

import type { PropsWithChildren } from 'react';

import { ApplicationBindingsProvider } from '@/core/composition/bindings/ApplicationBindingsProvider';
import { LayoutBindingsProvider } from '@/core/composition/layout-bindings';
import { QueryProvider } from '@/core/query';
import { UserProvider } from '@/react/hooks/useUser';
import { SidebarProvider } from '@/ui/layouts/mobile-navigation/useSidebarState';

export function LegacyConsoleProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ApplicationBindingsProvider>
        <SidebarProvider>
          <UserProvider>
            <LayoutBindingsProvider>{children}</LayoutBindingsProvider>
          </UserProvider>
        </SidebarProvider>
      </ApplicationBindingsProvider>
    </QueryProvider>
  );
}
