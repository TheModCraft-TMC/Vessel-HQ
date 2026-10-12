import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  tooltip?: string;
  error?: string;
  required?: boolean;
};

export function PasswordField({
  value,
  onChange,
  label,
  tooltip,
  error,
  required,
}: Props) {
  return (
    <FormControl
      inputId="Password"
      label={label}
      errors={error}
      required={required}
      tooltip={tooltip}
    >
      <Input
        id="Password"
        name="password"
        type="password"
        value={value}
        autoComplete="off"
        placeholder="*******"
        onChange={(e) => onChange(e.target.value)}
        data-cy="component-gitPasswordInput"
      />
    </FormControl>
  );
}
