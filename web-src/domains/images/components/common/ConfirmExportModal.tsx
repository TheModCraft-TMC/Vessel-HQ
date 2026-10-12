import { ModalType } from '@/ui/components/dialog';
import { openConfirm } from '@/ui/components/dialog/confirm';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

export async function confirmImageExport() {
  return openConfirm({
    modalType: ModalType.Warn,
    title: 'Caution',
    message:
      'The export may take several minutes, do not navigate away whilst the export is in progress.',
    confirmButton: buildConfirmButton('Continue'),
  });
}
