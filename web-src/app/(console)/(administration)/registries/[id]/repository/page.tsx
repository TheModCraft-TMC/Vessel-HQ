import { notFound } from 'next/navigation';

import {
  RegistryRepositoryContent,
  RegistryRepositoryHeader,
} from '@app/_components/pages/RegistryRepositoryPages';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ endpointId?: string; repository?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const registryId = Number(id);
  const environmentId = query.endpointId ? Number(query.endpointId) : undefined;
  if (!Number.isInteger(registryId) || registryId < 1 || !query.repository)
    notFound();
  return (
    <>
      <RegistryRepositoryHeader
        registryId={registryId}
        environmentId={environmentId}
        repository={query.repository}
      />
      <RegistryRepositoryContent
        registryId={registryId}
        environmentId={environmentId}
        repository={query.repository}
      />
    </>
  );
}
