import { notFound } from 'next/navigation';

import {
  EnvironmentDetailsContent,
  EnvironmentDetailsHeader,
} from '@app/_components/pages/EnvironmentDetailsPage';

export default async function EnvironmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const environmentId = Number(id);
  if (!Number.isInteger(environmentId) || environmentId < 1) notFound();

  return (
    <>
      <EnvironmentDetailsHeader environmentId={environmentId} />
      <EnvironmentDetailsContent environmentId={environmentId} />
    </>
  );
}
