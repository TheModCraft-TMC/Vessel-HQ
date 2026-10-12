'use client';

import { ChevronRight, Home } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GlobalSearch } from '@console/navigation/GlobalSearch';
import { Link } from '@console/navigation/Link';

import { useContainer } from '@/domains/containers';
import { ContextHelp } from '@/ui/layouts/view-layout/page-header/ContextHelp';
import { NotificationsMenu } from '@/ui/layouts/view-layout/page-header/NotificationsMenu';
import { UserMenu } from '@/ui/layouts/view-layout/page-header/UserMenu';
import { AskAILink } from '@/ui/layouts/view-layout/page-header/AskAILink';

import { useLayoutEnvironment, useLayoutIdentity } from './LayoutContext';
import {
  buildHeaderBreadcrumbs,
  getContainerIdFromPathname,
} from './headerBreadcrumbs';
import styles from './MainLayout.module.css';
import { SidebarToggleButton } from './SidebarToggleButton';

export function HeaderBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isBE, ddExtension } = useLayoutIdentity();
  const { environment } = useLayoutEnvironment();
  const containerId = getContainerIdFromPathname(pathname);
  const containerQuery = useContainer(
    {
      environmentId: environment?.Id || 0,
      containerId,
      nodeName: searchParams.get('nodeName') || undefined,
    },
    {
      enabled: Boolean(environment && containerId),
      select: (container) =>
        container.Name?.replace(/^\//, '') || container.Id || containerId,
    }
  );
  const breadcrumbs = buildHeaderBreadcrumbs(
    pathname,
    environment?.Name,
    containerId && containerQuery.data
      ? { [containerId]: containerQuery.data }
      : undefined
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>
        <SidebarToggleButton />
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link
            to="/"
            className={styles.breadcrumbHome}
            data-cy="header-breadcrumb-home"
            aria-label="Home"
          >
            <Home aria-hidden size={15} />
          </Link>
          <ol className={styles.breadcrumbList}>
            {breadcrumbs.map((breadcrumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1;

              return (
                <li
                  className={styles.breadcrumbItem}
                  key={`${breadcrumb.href || 'current'}-${breadcrumb.label}`}
                >
                  <ChevronRight
                    className={styles.crumbSeparator}
                    aria-hidden
                    size={13}
                  />
                  {breadcrumb.href && !isCurrent ? (
                    <Link
                      to={breadcrumb.href}
                      className={styles.breadcrumbLink}
                      data-cy={`header-breadcrumb-${index}`}
                      title={breadcrumb.label}
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <strong
                      className={styles.breadcrumbCurrent}
                      title={breadcrumb.label}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      {breadcrumb.label}
                    </strong>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className={styles.headerActions}>
        <GlobalSearch />
        {isBE && <AskAILink />}
        <NotificationsMenu />
        <ContextHelp />
        {!ddExtension && <UserMenu />}
      </div>
    </header>
  );
}
