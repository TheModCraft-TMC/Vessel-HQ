import { array, string } from 'yup';

import { FormError } from '@/ui/components/forms/FormError';
import { InputLabeled } from '@/ui/components/forms/Input/InputLabeled';
import { ItemProps } from '@/ui/components/forms/InputList';
import {
  ArrayError,
  InputList,
} from '@/ui/components/forms/InputList/InputList';

export const hostFileSchema = array(
  string().required('Entry is required')
).default([]);

export function HostsFileEntries({
  values,
  onChange,
  errors,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  errors?: ArrayError<string>;
}) {
  return (
    <InputList
      label="Hosts file entries"
      value={values}
      onChange={(hostsFileEntries) => onChange(hostsFileEntries)}
      errors={errors}
      item={HostsFileEntryItem}
      itemBuilder={() => ''}
      data-cy="hosts-file-entries"
    />
  );
}

function HostsFileEntryItem({
  item,
  onChange,
  disabled,
  error,
  readOnly,
  index,
}: ItemProps<string>) {
  return (
    <div>
      <InputLabeled
        label="value"
        value={item}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        data-cy={`hosts-file-entry_${index}`}
      />

      {error && <FormError>{error}</FormError>}
    </div>
  );
}
