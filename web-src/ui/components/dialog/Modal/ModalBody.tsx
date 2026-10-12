import type { PropsWithChildren } from 'react';

import styles from './Modal.module.css';
import { useModalContext } from './Modal';

export function ModalBody({ children }: PropsWithChildren<unknown>) {
  useModalContext();
  return <div className={styles.body}>{children}</div>;
}
