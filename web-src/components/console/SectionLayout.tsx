import type { ReactNode } from 'react';

export function SectionLayout({
  children,
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  return (
    <section data-console-section={name} style={{ minHeight: '100%' }}>
      {children}
    </section>
  );
}
