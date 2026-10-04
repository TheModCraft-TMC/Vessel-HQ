import { FormikErrors } from 'formik';

import { FormControl } from '@/ui/components/forms/FormControl';

export function NodeSelector({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: FormikErrors<string>;
}) {
  return (
    <FormControl label="Node" inputId="node-selector" errors={error}>
      <input
        id="node-selector"
        className="form-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-cy="docker-agent-node-selector"
      />
    </FormControl>
  );
}
