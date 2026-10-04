import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useQuery } from '@tanstack/react-query';

import { listRegistryCatalog } from '@/domains/registries/services/registry.service';
import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { withError } from '@/core/query';
import { PageHeader } from '@/ui/layouts/view-layout';

import { RepositoriesDatatable } from './RepositoriesDatatable';

export function RepositoriesView() {
  const params = useRouteParams();
  const registryId = parseId(params.id);
  const registryQuery = useRegistry(registryId);
  const catalogQuery = useQuery({
    queryKey: [...queryKeys.item(registryId), 'catalog'],
    queryFn: () =>
      registryQuery.data
        ? listRegistryCatalog(
            registryQuery.data,
            parseOptionalId(params.endpointId)
          )
        : Promise.resolve({ repositories: [] }),
    enabled: registryQuery.isSuccess,
    ...withError('Unable to retrieve registry repositories'),
  });

  const registryName = registryQuery.data?.Name || 'Registry';
  const repositories = catalogQuery.data?.repositories.map((Name) => ({
    Name,
  }));

  return (
    <>
      <PageHeader
        title={`${registryName} repositories`}
        breadcrumbs={[
          { label: 'Registries', link: '/registries' },
          registryName,
        ]}
        reload
      />
      <RepositoriesDatatable dataset={repositories} />
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
