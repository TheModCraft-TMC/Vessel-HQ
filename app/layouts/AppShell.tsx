import clsx from 'clsx';
import { UIView, useCurrentStateAndParams } from '@uirouter/react';

import { useSidebarState } from '@/react/sidebar/useSidebarState';

import styles from './AppShell.module.css';

const NO_SIDEBAR_STATES = [
  'portainer.auth',
  'portainer.init.admin',
  'portainer.init.edge',
  'portainer.logout',
  'kubernetes.kubectlshell',
];

export function AppShell() {
  const { state } = useCurrentStateAndParams();
  const { isOpen, toggle } = useSidebarState();
  const stateName = state.name || '';
  const hidesSidebar = NO_SIDEBAR_STATES.some((name) =>
    stateName.startsWith(name)
  );

  return (
    <div
      id="page-wrapper"
      className={clsx(styles.root, {
        open: isOpen && !hidesSidebar,
        nopadding: hidesSidebar,
      })}
    >
      {!hidesSidebar && (
        <aside id="sideview" aria-label="Primary navigation">
          <UIView name="sidebar" />
        </aside>
      )}

      {!hidesSidebar && isOpen && (
        <button
          className={styles.navigationBackdrop}
          type="button"
          aria-label="Close navigation"
          onClick={toggle}
        />
      )}

      <div id="content-wrapper" className={styles.content}>
        <main className={clsx('page-content', styles.main)}>
          <div id="view">
            <UIView name="content" />
          </div>
        </main>
      </div>
    </div>
  );
}
