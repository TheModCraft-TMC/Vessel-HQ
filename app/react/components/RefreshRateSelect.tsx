import { FormControl } from '@/ui/components/forms/FormControl';
import { Select } from '@/ui/components/forms/Input/Select';

type Props = {
  refreshRateMS: number;
  onChange(refreshRateMS: number): void;
  options: readonly number[];
  dataCy: string;
};

export function RefreshRateSelect({
  refreshRateMS,
  onChange,
  options,
  dataCy,
}: Props) {
  return (
    <FormControl label="Refresh rate" inputId="refreshRate">
      <Select
        id="refreshRate"
        value={refreshRateMS}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cy={dataCy}
        options={options.map((ms) => ({ value: ms, label: `${ms / 1000}s` }))}
      />
    </FormControl>
  );
}
