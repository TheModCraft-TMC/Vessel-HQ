import { CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import { Link } from '@console/navigation/Link';

import { useAuthorizations } from '@/core/session/useUser';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { DecoratedRegistry } from '@/domains/registries/views/ListView/RegistriesDatatable/types';
import { RegistryTypes } from '@/domains/registries/models/registry';
import { columnHelper } from '@/domains/registries/views/ListView/RegistriesDatatable/columns/helper';
import { BrowseButton } from '@/domains/registries/views/ListView/RegistriesDatatable/columns/actions';
import { Button } from '@/ui/components/buttons';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, unknown>) {
  const environmentId = useEnvironmentId();
  const { authorized: canUpdateAccess } = useAuthorizations(
    ['PortainerRegistryUpdateAccess'],
    environmentId,
    true
  );
  const canManageAccess =
    item.Type !== RegistryTypes.ANONYMOUS && canUpdateAccess;

  if (!item.Id) {
    return null;
  }

  return (
    <>
      {canManageAccess && (
        <Button
          color="link"
          icon={Users}
          as={Link}
          props={{
            to: './:id/access',
            params: { id: item.Id },
          }}
          data-cy={`registry-manage-access-button-${item.Name}`}
        >
          Manage access
        </Button>
      )}
      <BrowseButton registry={item} environmentId={environmentId} />
    </>
  );
}
