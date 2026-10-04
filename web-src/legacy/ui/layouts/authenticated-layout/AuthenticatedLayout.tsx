import { ReactNode } from 'react';

import { AppShell } from '../app-shell/AppShell';
import { useSidebarState } from '../mobile-navigation/useSidebarState';

interface Props {
  content: ReactNode;
  sidebar: ReactNode;
  sidebarVisible?: boolean;
}

export function AuthenticatedLayout({
  content,
  sidebar,
  sidebarVisible = true,
}: Props) {
  const { isOpen, toggle } = useSidebarState();

  return (
    <AppShell
      content={content}
      sidebar={sidebar}
      sidebarVisible={sidebarVisible}
      sidebarOpen={isOpen}
      onCloseSidebar={toggle}
    />
  );
}
