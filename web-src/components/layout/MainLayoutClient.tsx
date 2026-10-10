'use client';

import type { ReactNode } from 'react';

import { useSidebarState } from '@/ui/layouts/mobile-navigation/useSidebarState';

import { LegacyConsoleProviders } from '../console/LegacyConsoleProviders';

import { HeaderBar } from './HeaderBar';
import { SideNavigation } from './SideNavigation';
import styles from './MainLayout.module.css';

export function MainLayoutClient({ children }: { children: ReactNode }) {
  return (
    <LegacyConsoleProviders>
      <MainLayoutFrame>{children}</MainLayoutFrame>
    </LegacyConsoleProviders>
  );
}

function MainLayoutFrame({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebarState();

  return (
    <div
      className={`${styles.shell} ${isOpen ? 'open' : ''}`}
      data-sidebar-open={isOpen || undefined}
      id="page-wrapper"
    >
      <SideNavigation />
      <HeaderBar />
      <main className={styles.mainScroll}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
