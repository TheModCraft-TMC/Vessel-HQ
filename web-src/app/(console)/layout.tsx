import type { ReactNode } from 'react';
import { MainLayoutClient } from '@console/layout/MainLayoutClient';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
