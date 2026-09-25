import { Field, useField } from 'formik';
import { string } from 'yup';

import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';

import { EdgeUpdateSchedule } from '../types';

import { FormValues } from './types';

export function NameField() {
  const [{ name }, { error }] = useField<FormValues['name']>('name');

  return (
    <FormControl
      label="Name"
      required
      inputId="name-input"
      errors={error}
      tooltip="A descriptive name helps identify the update or roll back schedule when you have more than one"
    >
      <Field as={Input} name={name} id="name-input" />
    </FormControl>
  );
}

export function nameValidation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
) {
  return string()
    .required('This field is required')
    .test('unique', 'Name must be unique', (value) =>
      schedules.every((s) => s.id === currentId || s.name !== value)
    );
}
