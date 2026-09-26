import { Team } from '@/domains/teams';
import { Select } from '@/ui/components/forms/ReactSelect';

interface Props {
  value: Team[];
  onChange(value: readonly Team[]): void;
  options: Team[];
  inputId?: string;
}

// to be removed with the angularjs app/portainer/components/accessControlForm
export function PorAccessControlFormTeamSelector({
  value,
  onChange,
  options,
  inputId,
}: Props) {
  return (
    <Select
      isMulti
      getOptionLabel={(option) => option.Name}
      getOptionValue={(option) => String(option.Id)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy="portainer-selectTeamAccess"
      id="portainer-selectTeamAccess"
      inputId={inputId}
      placeholder="Select one or more teams"
    />
  );
}
