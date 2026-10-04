import { FormSection } from '@/ui/components/forms/FormSection';
import {
  EnvVarValues,
  EnvironmentVariablesFieldset,
} from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { ArrayError } from '@/ui/components/forms/InputList/InputList';

type Props = {
  values: EnvVarValues;
  onChange(value: EnvVarValues): void;
  errors?: ArrayError<EnvVarValues>;
};

export function EnvironmentVariablesFormSection({
  values,
  onChange,
  errors,
}: Props) {
  return (
    <FormSection title="Environment variables" titleSize="sm">
      <div className="mb-4">
        <EnvironmentVariablesFieldset
          values={values}
          onChange={onChange}
          errors={errors}
        />
      </div>
    </FormSection>
  );
}
