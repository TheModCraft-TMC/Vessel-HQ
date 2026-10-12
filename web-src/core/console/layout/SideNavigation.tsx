'use client';

import { Sidebar } from '@console/navigation/Sidebar/Sidebar';

import styles from './MainLayout.module.css';

export function SideNavigation() {
  return (
    <nav aria-label="Main navigation" className={styles.sidebarRegion}>
      <Sidebar />
    </nav>
  );
}
