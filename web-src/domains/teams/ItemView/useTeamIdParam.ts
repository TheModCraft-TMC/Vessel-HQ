import { useParams } from 'next/navigation';

export function useTeamIdParam() {
  const { id: teamIdParam } = useParams<{ id: string }>();
  const teamId = parseInt(teamIdParam, 10);

  if (!teamIdParam || Number.isNaN(teamId)) {
    throw new Error('Team ID is missing');
  }

  return teamId;
}
