import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Create Custom Template' };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
