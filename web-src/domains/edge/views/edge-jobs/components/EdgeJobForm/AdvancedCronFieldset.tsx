import { useField } from 'formik';
import { string } from 'yup';

import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';

import { TimeTip } from './TimeTip';

export function AdvancedCronFieldset() {
  const [{ value, onChange, name, onBlur }, { error }] =
    useField<string>('cronExpression');

  return (
    <>
      <FormControl label="Cron rule" inputId="edge_job_cron" errors={error}>
        <Input
          data-cy="edge-job-cron-input"
          id="edge_job_cron"
          placeholder="e.g. 0 2 * * *"
          required
          value={value}
          onChange={onChange}
          name={name}
          onBlur={onBlur}
        />
      </FormControl>

      <TimeTip />
    </>
  );
}
/**
 * Based on https://regexr.com/573i2. A field is a number, a list, a range or
 * step, or `*`. The `(?<!\d)` guard stops the unanchored search from retrying
 * inside a digit run, which keeps matching linear without changing what passes.
 */
export const cronRegex =
  /@(?:annually|yearly|monthly|weekly|daily|hourly|reboot)|@every (?:\d+(?:ns|us|µs|ms|s|m|h))+|(?:(?:(?<!\d)\d+(?:(?:,\d+)+|[/-]\d+)?|\*) ){4,6}(?:(?<!\d)\d+(?:(?:,\d+)+|[/-]\d+)?|\*)/;

export function cronValidation() {
  return string()
    .default('')
    .matches(cronRegex, 'This field format is invalid.');
}
