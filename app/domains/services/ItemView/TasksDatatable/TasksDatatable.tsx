import { List } from 'lucide-react';

import { Datatable } from '@/ui/components/data-table';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';
import { withColumnFilters } from '@/ui/components/data-table/extend-options/withColumnFilters';
import { withMeta } from '@/ui/components/data-table/extend-options/withMeta';
import {
  BasicTableSettings,
  filteredColumnsSettings,
  type FilteredColumnsTableSettings,
} from '@/ui/components/data-table/types';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';

import { useColumns } from './columns';
import { DecoratedTask } from './types';

const storageKey = 'docker-service-tasks';

interface TableSettings
  extends BasicTableSettings, FilteredColumnsTableSettings {}

export function TasksDatatable({
  dataset,
  isSlotColumnVisible,
  serviceName,
}: {
  dataset: DecoratedTask[];
  isSlotColumnVisible: boolean;
  serviceName: string;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
  const columns = useColumns(isSlotColumnVisible);

  return (
    <Datatable
      title="Tasks"
      titleIcon={List}
      settingsManager={tableState}
      columns={columns}
      dataset={dataset}
      extendTableOptions={mergeOptions(
        withMeta({ table: 'tasks', serviceName }),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      disableSelect
      data-cy="docker-service-tasks-datatable"
    />
  );
}
