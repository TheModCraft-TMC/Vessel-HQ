import { openSwitchPrompt } from '@/ui/components/dialog/SwitchPrompt';
import { ModalType } from '@/ui/components/dialog';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

export async function confirmServiceForceUpdate(message: string) {
  const result = await openSwitchPrompt('Are you sure?', 'Re-pull image', {
    message,
    confirmButton: buildConfirmButton('Update'),
    modalType: ModalType.Warn,
    'data-cy': 'confirm-service-force-update',
  });

  return result ? { pullLatest: result.value } : undefined;
}
