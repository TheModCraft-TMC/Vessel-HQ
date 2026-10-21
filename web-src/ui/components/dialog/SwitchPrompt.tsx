import type { ReactNode } from 'react';
import { useState } from 'react';

import type { AutomationTestingProps } from '@/shared/types';
import { SwitchField } from '@/ui/components/forms/SwitchField';

import { Dialog } from './Dialog';
import type { OnSubmit } from './Modal';
import { openModal } from './openModal';
import type { ButtonOptions, ModalType } from './types';
import { buildCancelButton, buildConfirmButton } from './utils';

function SwitchPrompt({
  onSubmit,
  title,
  confirmButton = buildConfirmButton('OK'),
  switchLabel,
  modalType,
  message,
  defaultValue = false,
  'data-cy': dataCy,
}: {
  onSubmit: OnSubmit<{ value: boolean }>;
  title: string;
  switchLabel: string;
  confirmButton?: ButtonOptions<true>;
  modalType?: ModalType;
  message?: ReactNode;
  defaultValue?: boolean;
} & AutomationTestingProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Dialog
      modalType={modalType}
      title={title}
      message={
        <>
          {message && <div className="mb-3">{message}</div>}
          <SwitchField
            name="value"
            data-cy={dataCy}
            label={switchLabel}
            checked={value}
            onChange={setValue}
          />
        </>
      }
      onSubmit={(confirm) => onSubmit(confirm ? { value } : undefined)}
      buttons={[buildCancelButton(), confirmButton]}
    />
  );
}

const defaultSwitchPromptOptions = { 'data-cy': 'switch-prompt' };

export function openSwitchPrompt(
  title: string,
  switchLabel: string,
  options: {
    confirmButton?: ButtonOptions<true>;
    modalType?: ModalType;
    message?: ReactNode;
    defaultValue?: boolean;
  } & AutomationTestingProps = defaultSwitchPromptOptions
) {
  return openModal(SwitchPrompt, { title, switchLabel, ...options });
}
