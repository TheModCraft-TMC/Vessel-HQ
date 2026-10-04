import { FormikErrors } from 'formik';

import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';

type Props = {
  onChange: (value: string) => void;
  values: string;
  errors: FormikErrors<string>;
  isEdit: boolean;
};

export function NameFormSection({
  onChange,
  values: appName,
  errors,
  isEdit,
}: Props) {
  return (
    <FormControl
      label="Name"
      inputId="application_name"
      errors={errors}
      required
    >
      <Input
        type="text"
        value={appName ?? ''}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        placeholder="e.g. my-app"
        disabled={isEdit}
        id="application_name"
        data-cy="k8sAppCreate-applicationName"
      />
    </FormControl>
  );
}
