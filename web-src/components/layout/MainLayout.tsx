'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const MainLayoutClient = dynamic(
  () => import('./MainLayoutClient').then((module) => module.MainLayoutClient),
  {
    ssr: false,
    loading: () => <div aria-label="Loading Vessel HQ" />,
  }
);

const PublicProviders = dynamic(
  () =>
    import('../console/LegacyConsoleProviders').then(
      (module) => module.LegacyConsoleProviders
    ),
  { ssr: false }
);

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return children;
  }

  if (pathname === '/logout' || pathname.startsWith('/init/')) {
    return <PublicProviders>{children}</PublicProviders>;
  }

  return <MainLayoutClient>{children}</MainLayoutClient>;
}
