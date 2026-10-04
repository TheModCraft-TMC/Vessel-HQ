'use client';

import { Bell, ChevronDown, CircleHelp, Home, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useSidebarState } from '@/ui/layouts/mobile-navigation/useSidebarState';

import { resolveConsoleRoute } from '../console/routes';

import styles from './MainLayout.module.css';

export function HeaderBar() {
  const pathname = usePathname();
  const { toggle } = useSidebarState();
  const routeTitle =
    pathname === '/'
      ? 'Environments'
      : resolveConsoleRoute(pathname.split('/').filter(Boolean))?.title ||
        'Console';

  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>
        <button
          className={styles.mobileMenu}
          type="button"
          aria-label="Open navigation"
          onClick={toggle}
        >
          <Menu aria-hidden size={19} />
        </button>
        <Home aria-hidden size={15} />
        <span className={styles.crumbSeparator}>/</span>
        <strong>{routeTitle}</strong>
      </div>

      <div className={styles.headerActions}>
        <button type="button" aria-label="Notifications">
          <Bell aria-hidden size={17} />
        </button>
        <button type="button" aria-label="Help">
          <CircleHelp aria-hidden size={17} />
        </button>
        <button type="button" className={styles.account}>
          admin
          <ChevronDown aria-hidden size={15} />
        </button>
      </div>
    </header>
  );
}
