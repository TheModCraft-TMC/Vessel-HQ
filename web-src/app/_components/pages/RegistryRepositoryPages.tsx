'use client';

import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { useRepositoryTags } from '@/domains/registries/queries/useRepositoryTags';
import { getRemoteProvider } from '@/domains/registries/services/remote-provider';
import { listRegistryCatalog } from '@/domains/registries/services/registry.service';
import { TagsDatatable } from '@/domains/registries/views/repositories/ItemView/TagsDatatable/TagsDatatable';
import { RepositoriesDatatable } from '@/domains/registries/views/repositories/ListView/RepositoriesDatatable';
import { PageHeader } from '@/ui/layouts/view-layout';

export function RegistryRepositoriesHeader({
  registryId,
}: {
  registryId: number;
}) {
  const registryQuery = useRegistry(registryId);
  const registryName = registryQuery.data?.Name || 'Registry';

  return (
    <PageHeader
      title={`${registryName} repositories`}
      breadcrumbs={[{ label: 'Registries', link: '/registries' }, registryName]}
      reload
    />
  );
}

export function RegistryRepositoriesContent({
  registryId,
  environmentId,
}: {
  registryId: number;
  environmentId?: number;
}) {
  const registryQuery = useRegistry(registryId);
  const catalogQuery = useQuery({
    queryKey: [...queryKeys.item(registryId), 'catalog'],
    queryFn: () =>
      registryQuery.data
        ? listRegistryCatalog(registryQuery.data, environmentId)
        : Promise.resolve({ repositories: [] }),
    enabled: registryQuery.isSuccess,
    ...withError('Unable to retrieve registry repositories'),
  });
  return (
    <RepositoriesDatatable
      dataset={catalogQuery.data?.repositories.map((Name) => ({ Name }))}
    />
  );
}

export function RegistryRepositoryHeader({
  registryId,
  environmentId,
  repository,
}: {
  registryId: number;
  environmentId?: number;
  repository: string;
}) {
  const registryQuery = useRegistry(registryId);
  const registryName = registryQuery.data?.Name || 'Registry';

  return (
    <PageHeader
      title={repository}
      breadcrumbs={[
        { label: 'Registries', link: '/registries' },
        {
          label: registryName,
          link: '/registries/:id/repositories',
          linkParams: { id: registryId, endpointId: environmentId },
        },
        repository,
      ]}
      reload
    />
  );
}

export function RegistryRepositoryContent({
  registryId,
  environmentId,
  repository,
}: {
  registryId: number;
  environmentId?: number;
  repository: string;
}) {
  const registryQuery = useRegistry(registryId);
  const tagsQuery = useRepositoryTags({
    registryId,
    environmentId,
    repository,
    provider: registryQuery.data
      ? getRemoteProvider(registryQuery.data.Type)
      : undefined,
  });
  return (
    <TagsDatatable
      dataset={
        tagsQuery.isLoading
          ? undefined
          : tagsQuery.data?.tags?.map((Name) => ({ Name })) || []
      }
      advancedFeaturesAvailable={false}
      onRemove={() => {}}
      onRetag={async () => {}}
    />
  );
}
