'use client';

import { Sidebar } from '@console/navigation/Sidebar/Sidebar';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import styles from './MainLayout.module.css';
import { useSidebarState } from './SidebarState';
import { SIDEBAR_MOBILE_BREAKPOINT } from './sidebarStore';

const mobileQuery = `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`;
function isMobileViewport() {
  return window.matchMedia(mobileQuery).matches;
}
function serverViewport() {
  return false;
}
function subscribeViewport(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function SideNavigation() {
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    serverViewport
  );
  const { isOpen, setOpen } = useSidebarState();

  if (isMobile) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content
          className={styles.sidebarRegion}
          id="console-navigation"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document
              .querySelector<HTMLButtonElement>(
                'button[aria-controls="console-navigation"]'
              )
              ?.focus();
          }}
        >
          <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
          <Dialog.Close
            className={styles.mobileDismiss}
            aria-label="Close navigation"
          >
            <X aria-hidden size={20} />
          </Dialog.Close>
          <nav
            aria-label="Main navigation"
            className="h-full"
            onClickCapture={(event) => {
              if ((event.target as Element).closest('a[href]')) setOpen(false);
            }}
          >
            <Sidebar showCloseButton={false} />
          </nav>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      className={styles.sidebarRegion}
      id="console-navigation"
    >
      <Sidebar />
    </nav>
  );
}
