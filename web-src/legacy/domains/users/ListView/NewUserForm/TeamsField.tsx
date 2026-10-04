import { useField } from 'formik';

import { Link } from '@/ui/components/links/Link';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Team } from '@/domains/teams';

import { TeamsSelector } from '@@/TeamsSelector';

import { FormValues } from './FormValues';

export function TeamsField({
  teams,
  disabled,
}: {
  teams: Array<Team>;
  disabled?: boolean;
}) {
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['teams']>('teams');

  return (
    <FormControl label="Add to team(s)" inputId="teams-field" errors={error}>
      {teams.length > 0 ? (
        <TeamsSelector
          dataCy="user-teamSelect"
          onChange={(value) => setValue(value)}
          value={value}
          name={name}
          teams={teams}
          inputId="teams-field"
          disabled={disabled}
        />
      ) : (
        <span className="small text-muted">
          You don&apos;t seem to have any teams to add users into. Head over to
          the{' '}
          <Link to="/teams" data-cy="teams-view-link">
            Teams view
          </Link>{' '}
          to create some.
        </span>
      )}
    </FormControl>
  );
}
