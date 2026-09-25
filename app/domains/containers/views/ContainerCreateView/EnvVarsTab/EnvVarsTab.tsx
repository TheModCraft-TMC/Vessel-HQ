import {
  EnvVarValues,
  EnvironmentVariablesPanel,
} from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { ArrayError } from '@/ui/components/forms/InputList/InputList';

export function EnvVarsTab({
  values,
  onChange,
  errors,
}: {
  values: EnvVarValues;
  onChange(value: EnvVarValues): void;
  errors?: ArrayError<EnvVarValues>;
}) {
  return (
    <div className="form-group">
      <EnvironmentVariablesPanel
        values={values}
        explanation="These values will be applied to the container when deployed"
        onChange={handleChange}
        errors={errors}
      />
    </div>
  );

  function handleChange(values: EnvVarValues) {
    onChange(values);
  }
}
