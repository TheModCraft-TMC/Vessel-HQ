import { useState } from 'react';

import { Registry } from '@/domains/registries';
import { Modal, OnSubmit, openModal } from '@/ui/components/dialog';
import { Button } from '@/ui/components/buttons';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

interface Props {
  registries: Registry[];
  onSubmit: OnSubmit<Registry['Id']>;
  defaultValue: Registry['Id'];
}

function RegistrySelectPrompt({ onSubmit, defaultValue, registries }: Props) {
  const title = 'Which registry do you want to use?';
  const [registryId, setRegistryId] = useState(defaultValue);
  const options = registries2Options(registries);

  return (
    <Modal onDismiss={() => onSubmit()} aria-label={title}>
      <Modal.Header title={title} />

      <Modal.Body>
        <PortainerSelect
          onChange={setRegistryId}
          value={registryId}
          options={options}
          data-cy="registry-select-selector"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => onSubmit()}
          color="default"
          data-cy="registry-select-cancel-button"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(registryId)}
          color="primary"
          data-cy="registry-select-update-button"
        >
          Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function selectRegistry(
  registries: Registry[],
  defaultValue: Registry['Id']
) {
  return openModal(RegistrySelectPrompt, {
    registries,
    defaultValue,
  });
}

function registries2Options(registries: Registry[]) {
  return registries.map((r) => ({
    label: r.Name,
    value: r.Id,
  }));
}
