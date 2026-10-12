'use client';

import type { PropsWithChildren } from 'react';
import { SidebarProvider } from '@console/layout/SidebarState';

import { ApplicationBindingsProvider } from '@/core/composition/bindings/ApplicationBindingsProvider';
import { QueryProvider } from '@/core/query';
import { UserProvider } from '@/core/session/useUser';

import { LayoutBindingsProvider } from './LayoutBindingsProvider';

export function ConsoleProviders({ children }: PropsWithChildren) {
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
