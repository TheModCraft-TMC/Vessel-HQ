'use client';

import { Home, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useSidebarState } from '@/ui/layouts/mobile-navigation/useSidebarState';
import { ContextHelp } from '@/ui/layouts/view-layout/page-header/ContextHelp';
import { NotificationsMenu } from '@/ui/layouts/view-layout/page-header/NotificationsMenu';
import { UserMenu } from '@/ui/layouts/view-layout/page-header/UserMenu';
import { AskAILink } from '@/ui/layouts/view-layout/page-header/AskAILink';
import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { resolveConsoleRoute } from '../console/routes';

import styles from './MainLayout.module.css';

export function HeaderBar() {
  const pathname = usePathname();
  const { toggle } = useSidebarState();
  const { isBE, ddExtension } = useLayoutBindings();
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
        {isBE && <AskAILink />}
        <NotificationsMenu />
        <ContextHelp />
        {!ddExtension && <UserMenu />}
      </div>
    </header>
  );
}
