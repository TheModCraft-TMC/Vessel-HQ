import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Azure container instances' };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
