import { TagIcon } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import { Tag } from '@/domains/tags';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

const columnHelper = createColumnHelper<Tag>();

const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
  }),
];

const tableKey = 'tags-table';

const store = createPersistedStore(tableKey);

export function TagsDatatable({
  dataset,
  onRemove,
}: {
  dataset: Array<Tag> | undefined;
  onRemove: (selectedItems: Array<Tag>) => void;
}) {
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      title="Tags"
      titleIcon={TagIcon}
      dataset={dataset || []}
      columns={columns}
      isLoading={!dataset}
      settingsManager={tableState}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          disabled={selectedItems.length === 0}
          confirmMessage="Are you sure you want to remove the selected tag(s)?"
          onConfirmed={() => onRemove(selectedItems)}
          data-cy="remove-tag-button"
        />
      )}
      data-cy="tags-datatable"
    />
  );
}
