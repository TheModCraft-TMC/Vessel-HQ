import type { ReactNode } from 'react';
import { SectionLayout } from '@console/console/SectionLayout';

export default function AppDeliveryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SectionLayout name="app-delivery">{children}</SectionLayout>;
}
