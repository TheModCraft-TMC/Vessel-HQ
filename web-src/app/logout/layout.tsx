import type { ReactNode } from 'react';
import { ConsoleProviders } from '@console/ConsoleProviders';

export default function LogoutLayout({ children }: { children: ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
