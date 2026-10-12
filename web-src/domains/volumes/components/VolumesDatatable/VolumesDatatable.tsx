import { Database } from 'lucide-react';

import { Datatable } from '@/ui/components/data-table';
import {
  BasicTableSettings,
  FilteredColumnsTableSettings,
  filteredColumnsSettings,
  createPersistedStore,
} from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { withMeta } from '@/ui/components/data-table/extend-options/withMeta';
import { withColumnFilters } from '@/ui/components/data-table/extend-options/withColumnFilters';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';

import { DecoratedVolume } from '../../models/types';

import { TableActions } from './TableActions';
import { useColumns } from './columns';

interface TableSettings
  extends BasicTableSettings, FilteredColumnsTableSettings {}

const storageKey = 'docker-volumes';
const store = createPersistedStore<TableSettings>(
  storageKey,
  undefined,
  (set) => ({
    ...filteredColumnsSettings(set),
  })
);

export function VolumesDatatable({
  dataset,
  onRemove,
  isBrowseVisible,
}: {
  dataset?: Array<DecoratedVolume>;
  onRemove(items: Array<DecoratedVolume>): void;
  isBrowseVisible: boolean;
}) {
  const tableState = useTableState(store, storageKey);
  const columns = useColumns();

  return (
    <Datatable
      title="Volumes"
      titleIcon={Database}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} onRemove={onRemove} />
      )}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'volumes',
          isBrowseVisible,
        }),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      data-cy="docker-volumes-datatable"
    />
  );
}
