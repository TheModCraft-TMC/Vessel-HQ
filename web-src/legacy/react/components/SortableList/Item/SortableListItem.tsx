import { ReactNode } from 'react';
import clsx from 'clsx';

import styles from './SortableListItem.module.css';

interface Props {
  children: ReactNode;
}

export function SortableListItem({ children }: Props) {
  return (
    <div
      className={clsx(
        styles.root,
        'border-0 border-b border-solid border-gray-5 px-5 py-3 th-dark:border-gray-9'
      )}
    >
      {children}
    </div>
  );
}
