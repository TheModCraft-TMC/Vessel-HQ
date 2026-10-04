import { notFound } from 'next/navigation';
import {
  RegistryDetailsContent,
  RegistryDetailsHeader,
} from '@console/console/pages/RegistryDetailsPage';

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registryId = Number(id);
  if (!Number.isInteger(registryId) || registryId < 1) notFound();

  return (
    <>
      <RegistryDetailsHeader registryId={registryId} />
      <RegistryDetailsContent registryId={registryId} />
    </>
  );
}
