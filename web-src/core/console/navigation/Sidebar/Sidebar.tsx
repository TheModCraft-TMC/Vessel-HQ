'use client';

import clsx from 'clsx';
import { Home } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLayoutIdentity } from '@console/layout/LayoutContext';

import { AppDeliverySidebar } from '@/ui/layouts/navigation/AppDeliverySidebar';
import { SettingsSidebar } from '@/ui/layouts/navigation/SettingsSidebar';

import { useSidebarState } from '../../layout/SidebarState';

import { EnvironmentSidebar } from './EnvironmentSidebar';
import { Footer } from './Footer';
import { SidebarBrand } from './SidebarBrand';
import { SidebarItem } from './SidebarItem';
import styles from './Sidebar.module.css';

const EdgeComputeSidebar = dynamic(() =>
  import('@/ui/layouts/navigation/EdgeComputeSidebar').then(
    (module) => module.EdgeComputeSidebar
  )
);

export function Sidebar({
  showCloseButton = true,
}: {
  showCloseButton?: boolean;
}) {
  const { isPureAdmin, isAdmin, isTeamLeader, publicSettings } =
    useLayoutIdentity();
  const { isOpen } = useSidebarState();

  if (!publicSettings) {
    return null;
  }

  return (
    <div
      className={clsx(styles.root, 'sidebar flex flex-col')}
      data-open={isOpen || undefined}
    >
      <nav
        className={clsx(styles.nav, 'flex min-h-0 flex-1 flex-col py-5 pl-5', {
          'overflow-hidden pr-5': isOpen,
          'overflow-visible': !isOpen,
        })}
        aria-label="Main"
      >
        <SidebarBrand
          logo={publicSettings.LogoURL}
          showCloseButton={showCloseButton}
        />
        <div
          className={clsx(
            styles.navListContainer,
            'be:scheme-dark th-highcontrast:scheme-dark th-dark:scheme-dark mt-6 min-h-0 flex-1 scheme-light',
            {
              '-mr-5 overflow-y-auto pr-5': isOpen,
              'overflow-visible': !isOpen,
            }
          )}
        >
          <ul className={clsx('space-y-5', { 'w-[32px]': !isOpen })}>
            <SidebarItem
              to="/"
              icon={Home}
              label="Home"
              data-cy="portainerSidebar-home"
            />
            <EnvironmentSidebar />
            <AppDeliverySidebar />
            {isAdmin && <EdgeComputeSidebar />}
            <SettingsSidebar
              isPureAdmin={isPureAdmin}
              isAdmin={isAdmin}
              isTeamLeader={isTeamLeader}
            />
          </ul>
        </div>
        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </nav>
    </div>
  );
}
