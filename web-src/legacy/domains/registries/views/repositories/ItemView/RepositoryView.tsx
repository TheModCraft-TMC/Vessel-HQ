import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { getRemoteProvider } from '@/domains/registries/services/remote-provider';
import { useRepositoryTags } from '@/domains/registries/queries/useRepositoryTags';
import { PageHeader } from '@/ui/layouts/view-layout';

import { TagsDatatable } from './TagsDatatable/TagsDatatable';

export function RepositoryView() {
  const params = useRouteParams();
  const registryId = parseId(params.id);
  const environmentId = parseOptionalId(params.endpointId);
  const repository = parseRepository(params.repository);
  const registryQuery = useRegistry(registryId);
  const tagsQuery = useRepositoryTags({
    registryId,
    environmentId,
    repository,
    provider: registryQuery.data
      ? getRemoteProvider(registryQuery.data.Type)
      : undefined,
  });
  const registryName = registryQuery.data?.Name || 'Registry';
  const tags = tagsQuery.data?.tags?.map((Name) => ({ Name })) || [];

  return (
    <>
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
      <TagsDatatable
        dataset={tagsQuery.isLoading ? undefined : tags}
        advancedFeaturesAvailable={false}
        onRemove={() => {}}
        onRetag={async () => {}}
      />
    </>
  );
}

function parseId(value: string | undefined) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Missing registry id');
  }
  return id;
}

function parseOptionalId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function parseRepository(value: string | undefined) {
  if (!value) {
    throw new Error('Missing repository name');
  }
  return value;
}
