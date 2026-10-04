'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

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
    const target = event.target as HTMLElement;
    const element = target.closest<HTMLElement>('[data-cy]');
    const route = element?.dataset.cy ? routes[element.dataset.cy] : undefined;
    if (!route) return;

    event.preventDefault();
    event.stopPropagation();
    router.push(route);
  }

  return (
    <nav aria-label="Main navigation" onClickCapture={navigate}>
      <PortainerNavigation />
    </nav>
  );
}
