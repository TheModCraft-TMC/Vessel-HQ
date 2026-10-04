import { notFound } from 'next/navigation';
import {
  TeamDetailsContent,
  TeamDetailsHeader,
} from '@console/console/pages/TeamDetailsPage';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId < 1) notFound();

  return (
    <>
      <TeamDetailsHeader teamId={teamId} />
      <TeamDetailsContent teamId={teamId} />
    </>
  );
}
