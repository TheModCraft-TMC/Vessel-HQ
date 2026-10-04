import { ReactNode } from 'react';
import clsx from 'clsx';

import styles from './AppShell.module.css';

interface AppShellProps {
  content: ReactNode;
  sidebar: ReactNode;
  sidebarVisible: boolean;
  sidebarOpen: boolean;
  onCloseSidebar(): void;
}

export function AppShell({
  content,
  sidebar,
  sidebarVisible,
  sidebarOpen,
  onCloseSidebar,
}: AppShellProps) {
  return (
    <div
      id="page-wrapper"
      className={clsx(styles.root, {
        [styles.hasSidebar]: sidebarVisible,
        open: sidebarOpen && sidebarVisible,
        nopadding: !sidebarVisible,
      })}
    >
      {sidebarVisible && (
        <aside id="sideview" aria-label="Primary navigation">
          {sidebar}
        </aside>
      )}

      {sidebarVisible && sidebarOpen && (
        <button
          className={styles.navigationBackdrop}
          type="button"
          aria-label="Close navigation"
          onClick={onCloseSidebar}
        />
      )}

      <div id="content-wrapper" className={styles.content}>
        <main className={clsx('page-content', styles.main)}>
          <div id="view">{content}</div>
        </main>
      </div>
    </div>
  );
}
