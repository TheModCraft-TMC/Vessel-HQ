import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/ui/components/buttons';

import { Modal, type OnSubmit } from './Modal';
import { openModal } from './openModal';
import type { ButtonOptions } from './types';
import { ModalType } from './types';

export interface DialogOptions<T> {
  title?: ReactNode;
  message: ReactNode;
  modalType?: ModalType;
  buttons: Array<ButtonOptions<T>>;
}

export function Dialog<T>({
  buttons,
  message,
  title,
  onSubmit,
  modalType,
}: DialogOptions<T> & { onSubmit: OnSubmit<T> }) {
  const [count, setCount] = useState(
    () => buttons.find((button) => button.timeout)?.timeout ?? 0
  );

  useEffect(() => {
    const timedButton = buttons.find((button) => button.timeout);
    if (!timedButton?.timeout) return undefined;

    let remaining = timedButton.timeout;
    const interval = window.setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining === 0) {
        window.clearInterval(interval);
        onSubmit(timedButton.value);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [buttons, onSubmit]);

  return (
    <Modal
      onDismiss={() => onSubmit()}
      aria-label={requireString(title) || requireString(message) || 'Dialog'}
    >
      {title && <Modal.Header title={title} modalType={modalType} />}
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        {buttons.map((button) => (
          <Button
            onClick={() => onSubmit(button.value)}
            className={button.className}
            color={button.color}
            key={button.dataCy}
            size="medium"
            data-cy={button.dataCy}
          >
            {button.label} {button.timeout && count ? `(${count})` : null}
          </Button>
        ))}
      </Modal.Footer>
    </Modal>
  );
}

export function openDialog<T>(options: DialogOptions<T>) {
  return openModal<DialogOptions<T>, T>(Dialog, options);
}

function requireString(value: ReactNode) {
  return typeof value === 'string' ? value : undefined;
}
