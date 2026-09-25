import { Team, TeamId } from '@/domains/teams';

import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

interface Props {
  name?: string;
  value: TeamId[] | readonly TeamId[];
  onChange(value: TeamId[]): void;
  teams: Team[];
  dataCy: string;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TeamsSelector({
  name,
  value,
  onChange,
  teams,
  dataCy,
  inputId,
  placeholder,
  disabled,
}: Props) {
  const options = teams.map((team) => ({ label: team.Name, value: team.Id }));

  return (
    <PortainerSelect<number>
      name={name}
      isMulti
      options={options}
      value={value}
      onChange={(value) => onChange(value)}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
