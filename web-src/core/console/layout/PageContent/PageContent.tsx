import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import styles from './PageContent.module.css';

type Gap = 'none' | 'small' | 'medium' | 'large';

interface Props {
  className?: string;
  gap?: Gap;
  flushBottom?: boolean;
}

/**
 * Provides the shared horizontal inset, bottom spacing, and vertical rhythm for
 * the content below a page header.
 */
export function PageContent({
  children,
  className,
  gap = 'medium',
  flushBottom = false,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        styles.root,
        {
          [styles.gapNone]: gap === 'none',
          [styles.gapSmall]: gap === 'small',
          [styles.gapLarge]: gap === 'large',
          [styles.flushBottom]: flushBottom,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
