import type { PropsWithChildren } from 'react';

import styles from './Modal.module.css';
import { useModalContext } from './Modal';

export function ModalFooter({ children }: PropsWithChildren<unknown>) {
  useModalContext();
  return <div className={styles.footer}>{children}</div>;
}
