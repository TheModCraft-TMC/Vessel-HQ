import type { ReactNode } from 'react';
import { SectionLayout } from '@console/console/SectionLayout';

export default function AdministrationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SectionLayout name="administration">{children}</SectionLayout>;
}
