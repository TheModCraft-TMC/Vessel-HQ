'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

import styles from './MainLayout.module.css';

const PortainerNavigation = dynamic(
  () =>
    import('@/ui/layouts/navigation/Sidebar').then((module) => module.Sidebar),
  { ssr: false }
);

const routes: Record<string, string> = {
  'portainerSidebar-home': '/',
  'portainerSidebar-workflows': '/workflows',
  'portainerSidebar-sources': '/sources',
  'portainerSidebar-userRelated-link': '/users',
  'portainerSidebar-users': '/users',
  'portainerSidebar-teams': '/teams',
  'portainerSidebar-roles': '/roles',
  'portainerSidebar-environments-area-link': '/environments',
  'portainerSidebar-environments': '/environments',
  'portainerSidebar-environmentGroups': '/groups',
  'portainerSidebar-environmentTags': '/tags',
  'portainerSidebar-registries': '/registries',
  'portainerSidebar-activityLogs': '/activity-logs',
  'portainerSidebar-notifications': '/notifications',
  'portainerSidebar-settings-link': '/settings',
  'portainerSidebar-generalSettings': '/settings',
  'portainerSidebar-authentication': '/settings/authentication',
  'portainerSidebar-edgeCompute': '/settings/edge-compute',
};

export function SideNavigation() {
  const router = useRouter();

  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target as HTMLElement;
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (
      anchor &&
      !anchor.download &&
      (!anchor.target || anchor.target === '_self')
    ) {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) {
        event.preventDefault();
        event.stopPropagation();
        router.push(`${url.pathname}${url.search}${url.hash}`);
        return;
      }
    }

    const element = target.closest<HTMLElement>('[data-cy]');
    const route = element?.dataset.cy ? routes[element.dataset.cy] : undefined;
    if (!route) return;

    event.preventDefault();
    event.stopPropagation();
    router.push(route);
  }

  return (
    <nav
      aria-label="Main navigation"
      className={styles.sidebarRegion}
      onClickCapture={navigate}
    >
      <PortainerNavigation />
    </nav>
  );
}
