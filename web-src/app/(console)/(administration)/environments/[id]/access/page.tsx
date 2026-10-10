import { notFound } from 'next/navigation';

import {
  EnvironmentAccessContent,
  EnvironmentAccessHeader,
} from '@app/_components/pages/EnvironmentAccessPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const environmentId = Number(id);
  if (!Number.isInteger(environmentId) || environmentId < 1) notFound();
  return (
    <>
      <EnvironmentAccessHeader environmentId={environmentId} />
      <EnvironmentAccessContent environmentId={environmentId} />
    </>
  );
}
