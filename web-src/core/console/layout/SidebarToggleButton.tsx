'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import styles from './MainLayout.module.css';
import { useSidebarState } from './SidebarState';

export function SidebarToggleButton() {
  const { isOpen, toggle } = useSidebarState();
  const label = isOpen ? 'Collapse sidebar' : 'Expand sidebar';

  return (
    <button
      type="button"
      className={styles.sidebarToggle}
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
      onClick={toggle}
    >
      {isOpen ? (
        <PanelLeftClose aria-hidden="true" size={18} />
      ) : (
        <PanelLeftOpen aria-hidden="true" size={18} />
      )}
    </button>
  );
}
