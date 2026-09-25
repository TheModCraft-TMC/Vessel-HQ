import { ModalType } from '@/ui/components/dialog';
import { openSwitchPrompt } from '@/ui/components/dialog/SwitchPrompt';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

export async function confirmContainerDeletion(title: string) {
  const result = await openSwitchPrompt(
    title,
    'Automatically remove non-persistent volumes',
    {
      confirmButton: buildConfirmButton('Remove', 'danger'),
      modalType: ModalType.Destructive,
      'data-cy': 'confirm-container-delete-button',
    }
  );

  return result ? { removeVolumes: result.value } : undefined;
}
