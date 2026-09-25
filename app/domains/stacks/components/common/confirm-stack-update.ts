import { openSwitchPrompt } from '@/ui/components/dialog/SwitchPrompt';
import { ModalType } from '@/ui/components/dialog';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

export async function confirmStackUpdate(
  message: string,
  defaultValue: boolean
) {
  const result = await openSwitchPrompt(
    'Are you sure?',
    'Re-pull image and redeploy',
    {
      message,
      confirmButton: buildConfirmButton('Update'),
      modalType: ModalType.Warn,
      defaultValue,
      'data-cy': 'confirm-stack-update',
    }
  );

  return result ? { repullImageAndRedeploy: result.value } : undefined;
}
