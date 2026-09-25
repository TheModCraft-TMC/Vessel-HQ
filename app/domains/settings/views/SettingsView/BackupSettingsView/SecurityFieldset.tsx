import { useField, Field } from 'formik';

import { FormSection } from '@/ui/components/forms/FormSection';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { SwitchField } from '@/ui/components/forms/SwitchField';

interface Props {
  switchDataCy: string;
  inputDataCy: string;
  disabled?: boolean;
}

export function SecurityFieldset({
  switchDataCy,
  inputDataCy,
  disabled,
}: Props) {
  const [{ value: passwordProtect }, , { setValue: setPasswordProtect }] =
    useField<boolean>('passwordProtect');

  const [{ name }, { error }] = useField<string>('password');

  return (
    <FormSection title="Security settings">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="password-switch"
            labelClass="col-sm-3 col-lg-2"
            label="Password Protect"
            checked={passwordProtect}
            data-cy={switchDataCy}
            onChange={(checked) => setPasswordProtect(checked)}
            disabled={disabled}
          />
        </div>
      </div>

      {passwordProtect && (
        <FormControl
          inputId="password"
          label="Password"
          size="small"
          errors={error}
          required
        >
          <Field
            id="password"
            name={name}
            type="password"
            as={Input}
            data-cy={inputDataCy}
            required
          />
        </FormControl>
      )}
    </FormSection>
  );
}
