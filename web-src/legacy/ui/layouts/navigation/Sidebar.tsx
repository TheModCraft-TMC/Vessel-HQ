import clsx from 'clsx';
import { Home } from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import styles from './Sidebar.module.css';
import { EdgeComputeSidebar } from './EdgeComputeSidebar';
import { EnvironmentSidebar } from './EnvironmentSidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { SidebarItem } from './SidebarItem';
import { Footer } from './Footer';
import { Header } from './Header';
import { SidebarProvider, useSidebarState } from './useSidebarState';
import { AppDeliverySidebar } from './AppDeliverySidebar';

export function Sidebar() {
  return (
    /* in the future (when we remove r2a) this should wrap the whole app - to change root styles */
    <SidebarProvider>
      <InnerSidebar />
    </SidebarProvider>
  );
}

function InnerSidebar() {
  const { isPureAdmin, isAdmin, isTeamLeader, publicSettings } =
    useLayoutBindings();
  const { isOpen } = useSidebarState();

  if (!publicSettings) {
    return null;
  }

  const { LogoURL } = publicSettings;

  return (
    <div className={clsx(styles.root, 'sidebar flex flex-col')}>
      <nav
        className={clsx(
          styles.nav,
          'flex min-h-0 flex-1 flex-col overflow-hidden py-5 pl-5',
          { 'pr-5': isOpen }
        )}
        aria-label="Main"
      >
        <Header logo={LogoURL} />
        {/* negative margin + padding -> scrollbar won't hide the content */}
        <div
          className={clsx(
            styles.navListContainer,
            'mt-6 min-h-0 flex-1 overflow-y-auto [color-scheme:light] be:[color-scheme:dark] th-highcontrast:[color-scheme:dark] th-dark:[color-scheme:dark]',
            { '-mr-5 pr-5': isOpen }
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
