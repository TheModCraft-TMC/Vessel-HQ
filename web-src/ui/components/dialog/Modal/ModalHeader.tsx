import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { isValidElement, type ReactNode } from 'react';

import styles from './Modal.module.css';
import { useModalContext } from './Modal';
import { ModalType } from './types';

export function ModalHeader({
  title,
  modalType,
}: {
  title: ReactNode;
  modalType?: ModalType;
}) {
  useModalContext();

  return (
    <div className={styles.header}>
      {modalType && (
        <div
          className={clsx({
            [styles.backgroundError]: modalType === ModalType.Destructive,
            [styles.backgroundWarning]: modalType === ModalType.Warn,
          })}
        />
      )}
      {isValidElement(title) ? (
        <Dialog.Title asChild>{title}</Dialog.Title>
      ) : (
        <Dialog.Title className="m-0 text-lg font-bold">
          {title}
        </Dialog.Title>
      )}
    </div>
  );
}
