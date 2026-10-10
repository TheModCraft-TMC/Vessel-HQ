import { notFound } from 'next/navigation';

import {
  RegistryRepositoriesContent,
  RegistryRepositoriesHeader,
} from '@app/_components/pages/RegistryRepositoryPages';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ endpointId?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const registryId = Number(id);
  const environmentId = query.endpointId ? Number(query.endpointId) : undefined;
  if (!Number.isInteger(registryId) || registryId < 1) notFound();
  return (
    <>
      <RegistryRepositoriesHeader registryId={registryId} />
      <RegistryRepositoriesContent
        registryId={registryId}
        environmentId={environmentId}
      />
    </>
  );
}
