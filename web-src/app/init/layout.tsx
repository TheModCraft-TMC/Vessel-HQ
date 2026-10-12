import type { ReactNode } from 'react';
import { ConsoleProviders } from '@console/ConsoleProviders';

export default function InitLayout({ children }: { children: ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
