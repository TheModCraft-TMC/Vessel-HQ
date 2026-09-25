import { ReactNode } from 'react';

import { AppShell } from '../app-shell/AppShell';

interface Props {
  content: ReactNode;
}

export function PublicLayout({ content }: Props) {
  return (
    <AppShell
      content={content}
      sidebar={null}
      sidebarVisible={false}
      sidebarOpen={false}
      onCloseSidebar={() => undefined}
    />
  );
}
