import type { PropsWithChildren, ReactNode } from 'react';

import { useSidebarState } from '../../layout/SidebarState';

interface Props {
  title: ReactNode;
  hoverText?: string;
  showTitleWhenOpen?: boolean;
  'aria-label'?: string;
}

export function SidebarSection({
  title,
  hoverText,
  children,
  showTitleWhenOpen,
  'aria-label': ariaLabel,
}: PropsWithChildren<Props>) {
  return (
    <div>
      <SidebarSectionTitle
        showWhenOpen={showTitleWhenOpen}
        hoverText={hoverText}
      >
        {title}
      </SidebarSectionTitle>
      <nav
        aria-label={typeof title === 'string' ? title : ariaLabel}
        className="mt-4"
      >
        <ul>{children}</ul>
      </nav>
    </div>
  );
}

export function SidebarSectionTitle({
  showWhenOpen,
  hoverText,
  children,
}: PropsWithChildren<{ showWhenOpen?: boolean; hoverText?: string }>) {
  const { isOpen } = useSidebarState();

  if (!isOpen && !showWhenOpen) {
    return null;
  }

  return (
    <li
      title={hoverText}
      className="ml-3 text-sm text-gray-3 transition-all duration-500 ease-in-out be:text-gray-6"
    >
      {children}
    </li>
  );
}
