import { useRouteParams } from '@console/console/routing/useRouteParams';
import { createColumnHelper, CellContext } from '@tanstack/react-table';

import { useRepositoryTags } from '@/domains/registries/queries/useRepositoryTags';
import { Link } from '@/ui/components/links/Link';

import { Repository } from './types';

const helper = createColumnHelper<Repository>();

export const columns = [
  helper.accessor('Name', {
    header: 'Repository',
    cell: NameCell,
  }),
  helper.display({
    header: 'Tags count',
    cell: TagsCell,
  }),
];

function useParams() {
  const { endpointId, id } = useRouteParams();

  const registryId = number(id);

  if (!registryId) {
    throw new Error('Missing registry id');
  }

  return {
    environmentId: number(endpointId),
    registryId,
  };
}

function number(value: string | undefined) {
  const num = parseInt(value || '', 10);
  return Number.isNaN(num) ? undefined : num;
}

function NameCell({ getValue }: CellContext<Repository, string>) {
  const { environmentId } = useParams();
  const name = getValue();
  return (
    <Link
      to="/registries/:id/repository"
      params={{ repository: name, endpointId: environmentId }}
      title={name}
      data-cy={`repository-name-link-${name}`}
    >
      {name}
    </Link>
  );
}

function TagsCell({ row }: CellContext<Repository, unknown>) {
  const { environmentId, registryId } = useParams();

  const tagsQuery = useRepositoryTags({
    environmentId,
    registryId,
    repository: row.original.Name,
  });

  return tagsQuery.data?.tags.length || 0;
}
