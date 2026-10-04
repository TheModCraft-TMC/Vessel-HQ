import { CellContext } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { EnvironmentId } from '@/domains/environments';
import { RegistryTypes } from '@/domains/registries/models/registry';
import { Link } from '@/ui/components/links/Link';
import { Button } from '@/ui/components/buttons';

import { DecoratedRegistry } from '../types';

import { columnHelper } from './helper';
import { DefaultRegistryAction } from './DefaultRegistryAction';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

const nonBrowsableTypes = [
  RegistryTypes.ANONYMOUS,
  RegistryTypes.DOCKERHUB,
  RegistryTypes.QUAY,
];

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, unknown>) {
  if (!item.Id) {
    return <DefaultRegistryAction />;
  }

  return <BrowseButton registry={item} />;
}

export function BrowseButton({
  registry,
  environmentId,
}: {
  registry: DecoratedRegistry;
  environmentId?: EnvironmentId;
}) {
  const canBrowse = !nonBrowsableTypes.includes(registry.Type);

  if (!canBrowse) {
    return null;
  }

  return (
    <Button
      color="link"
      as={Link}
      props={{
        to: '/registries/:id/repositories',
        params: { id: registry.Id, endpointId: environmentId },
      }}
      icon={Search}
      data-cy={`browse-registry-button-${registry.Name}`}
    >
      Browse
    </Button>
  );
}
