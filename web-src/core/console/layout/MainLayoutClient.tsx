'use client';

import { type ReactNode, ViewTransition } from 'react';

import { ConsoleProviders } from '../ConsoleProviders';
import { BrowserNavigationTransitions } from '../navigation/BrowserNavigationTransitions';

import { HeaderBar } from './HeaderBar';
import { SideNavigation } from './SideNavigation';
import styles from './MainLayout.module.css';
import { useSidebarState } from './SidebarState';

export function MainLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ConsoleProviders>
      <MainLayoutFrame>{children}</MainLayoutFrame>
    </ConsoleProviders>
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
      <BrowserNavigationTransitions />
      <SideNavigation />
      <HeaderBar />
      <main className={styles.mainScroll}>
        <ViewTransition
          name="console-route"
          update={{
            default: 'console-route',
            'container-forward': 'container-forward',
            'container-back': 'container-back',
          }}
        >
          <div className={styles.content}>{children}</div>
        </ViewTransition>
      </main>
    </div>
  );
}
