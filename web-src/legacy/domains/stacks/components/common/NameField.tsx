import { FormikErrors } from 'formik';
import { SchemaOf, string } from 'yup';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';
import { EnvironmentId } from '@/domains/environments';
import { Stack } from '@/domains/stacks/models/types';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';

export function NameField({
  onChange,
  value,
  errors,
  placeholder,
}: {
  onChange(value: string): void;
  value: string;
  errors?: FormikErrors<string>;
  placeholder?: string;
}) {
  return (
    <FormControl
      inputId="name-input"
      label="Name"
      errors={errors}
      required
      size="xsmall"
    >
      <Input
        id="name-input"
        onChange={(e) => onChange(e.target.value)}
        value={value}
        placeholder={placeholder}
        required
        data-cy="stack-name-input"
      />
    </FormControl>
  );
}

/**
 * Stack name validation with uniqueness check
 */
export function nameValidation({
  environmentId,
  stacks = [],
  excludeStackName,
}: {
  environmentId: EnvironmentId;
  stacks?: Array<Stack>;
  excludeStackName?: string;
}): SchemaOf<string> {
  return string()
    .default('')
    .test(
      'unique',
      'Name should be unique',
      (value) =>
        !value ||
        excludeStackName === value ||
        stacks.every((s) => s.EndpointId !== environmentId || s.Name !== value)
    )
    .matches(new RegExp(STACK_NAME_VALIDATION_REGEX), {
      excludeEmptyString: true,
      message:
        "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123').",
    });
}
