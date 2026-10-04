import { createColumnHelper } from '@tanstack/react-table';
import { Lock } from 'lucide-react';

import { SecretViewModel } from '@/domains/services/models/secret';
import { isoDate } from '@/portainer/filters/filters';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { buildNameColumn } from '@/ui/components/data-table/buildNameColumn';
import { Datatable } from '@/ui/components/data-table';
import {
  BasicTableSettings,
  createPersistedStore,
} from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { AddButton } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';

const columnHelper = createColumnHelper<SecretViewModel>();

const columns = [
  buildNameColumn<SecretViewModel>('Name', './:id', 'docker-secrets-name'),
  columnHelper.accessor((item) => isoDate(item.CreatedAt), {
    header: 'Creation Date',
  }),
  createOwnershipColumn<SecretViewModel>(),
];

type TableSettings = BasicTableSettings;

const storageKey = 'docker-secrets';
const store = createPersistedStore<TableSettings>(storageKey);

export function SecretsDatatable({
  dataset,
  onRemove,
}: {
  dataset?: Array<SecretViewModel>;
  onRemove(items: Array<SecretViewModel>): void;
}) {
  const tableState = useTableState(store, storageKey);

  const hasWriteAccessQuery = useAuthorizations([
    'DockerSecretCreate',
    'DockerSecretDelete',
  ]);

  return (
    <Datatable
      title="Secrets"
      titleIcon={Lock}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      disableSelect={!hasWriteAccessQuery.authorized}
      settingsManager={tableState}
      data-cy="docker-secrets-datatable"
      renderTableActions={(selectedItems) =>
        hasWriteAccessQuery.authorized && (
          <TableActions selectedItems={selectedItems} onRemove={onRemove} />
        )
      }
    />
  );
}

function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<SecretViewModel>;
  onRemove(items: Array<SecretViewModel>): void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="DockerSecretDelete">
        <DeleteButton
          disabled={selectedItems.length === 0}
          onConfirmed={() => onRemove(selectedItems)}
          confirmMessage="Do you want to remove the selected secret(s)?"
          data-cy="secret-removeSecretButton"
        />
      </Authorized>

      <Authorized authorizations="DockerSecretCreate">
        <AddButton data-cy="secret-addSecretButton">Add secret</AddButton>
      </Authorized>
    </div>
  );
}
