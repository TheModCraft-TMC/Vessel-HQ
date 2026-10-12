import type { PropsWithChildren, ReactNode } from 'react';

import styles from './SidebarTooltip.module.css';

export function SidebarTooltip({
  children,
  content,
}: PropsWithChildren<{ content: ReactNode }>) {
  return (
    <div className={styles.root}>
      {children}
      <div className={styles.content} role="tooltip">
        {content}
      </div>
    </div>
  );
}
