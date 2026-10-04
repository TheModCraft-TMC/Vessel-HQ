import { notFound } from 'next/navigation';
import {
  EnvironmentGroupDetailsContent,
  EnvironmentGroupDetailsHeader,
} from '@console/console/pages/EnvironmentGroupDetailsPage';

export default async function EnvironmentGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId) || groupId < 1) notFound();

  return (
    <>
      <EnvironmentGroupDetailsHeader groupId={groupId} />
      <EnvironmentGroupDetailsContent groupId={groupId} />
    </>
  );
}
