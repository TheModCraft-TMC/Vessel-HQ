import { Database } from 'lucide-react';

import { Datatable } from '@@/datatables';
import {
  BasicTableSettings,
  FilteredColumnsTableSettings,
  filteredColumnsSettings,
  createPersistedStore,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { DecoratedVolume } from '../types';

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
