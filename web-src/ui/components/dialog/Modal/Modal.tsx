'use client';

import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';

import styles from './Modal.module.css';

const Context = createContext(false);
Context.displayName = 'ModalContext';

export function useModalContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('should be nested under Modal');
  }
  return context;
}

export function Modal({
  children,
  onDismiss,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
  className,
  dialogClassName,
}: PropsWithChildren<{
  onDismiss?(): void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  dialogClassName?: string;
}>) {
  return (
    <Context.Provider value>
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) onDismiss?.();
        }}
      >
        <Dialog.Portal>
          <div data-reach-dialog-overlay="true">
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={undefined}
              className={clsx(
                styles.dialog,
                {
                  'w-[450px]': size === 'md',
                  'w-[700px]': size === 'lg',
                  'w-[1000px]': size === 'xl',
                },
                dialogClassName
              )}
            >
              <div className={clsx(styles.content, className)}>{children}</div>
              {onDismiss && (
                <Dialog.Close
                  className={styles.close}
                  aria-label="Close dialog"
                >
                  ×
                </Dialog.Close>
              )}
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </Context.Provider>
  );
}
