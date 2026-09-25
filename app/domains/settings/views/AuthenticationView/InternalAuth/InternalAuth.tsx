import { Settings } from '@/domains/settings/models/types';
import { confirmDestructive } from '@/ui/components/dialog/confirm';
import { FormSectionTitle } from '@/ui/components/forms/FormSectionTitle';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

import { PasswordLengthSlider } from './PasswordLengthSlider/PasswordLengthSlider';
import { SaveAuthSettingsButton } from './SaveAuthSettingsButton';

export interface Props {
  onSaveSettings(): void;
  isLoading: boolean;
  value: Settings['InternalAuthSettings'];
  onChange(value: number): void;
}

export function InternalAuth({
  onSaveSettings,
  isLoading,
  value,
  onChange,
}: Props) {
  async function onSubmit() {
    if (value.RequiredPasswordLength < 10) {
      const confirmed = await confirmDestructive({
        title: 'Allow weak passwords?',
        message:
          'You have set an insecure minimum password length. This could leave your system vulnerable to attack, are you sure?',
        confirmButton: buildConfirmButton('Yes', 'danger'),
      });

      if (confirmed) {
        onSaveSettings();
      }
    } else {
      onSaveSettings();
    }
  }

  return (
    <>
      <FormSectionTitle>Information</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        When using internal authentication, Vessel HQ will encrypt user
        passwords and store credentials locally.
      </div>

      <FormSectionTitle>Password rules</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        Define minimum length for user-generated passwords.
      </div>

      <div className="form-group">
        <PasswordLengthSlider
          min={1}
          max={18}
          step={1}
          value={value.RequiredPasswordLength}
          onChange={onChange}
        />
      </div>

      <SaveAuthSettingsButton onSubmit={onSubmit} isLoading={isLoading} />
    </>
  );
}
