import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ContainerRouteHeader } from '../../_components/ContainerPageHeader';

export const metadata: Metadata = { title: 'Container' };

export default function ContainerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ContainerRouteHeader />
      {children}
    </>
  );
}
