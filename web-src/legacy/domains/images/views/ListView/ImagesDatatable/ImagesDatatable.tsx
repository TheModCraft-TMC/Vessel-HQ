import { List } from 'lucide-react';
import { useMemo } from 'react';

import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import {
  BasicTableSettings,
  createPersistedStore,
  FilteredColumnsTableSettings,
  filteredColumnsSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { AddButton } from '@/ui/components/buttons';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';
import { withColumnFilters } from '@/ui/components/data-table/extend-options/withColumnFilters';

import { useImages } from '../../../queries/useImages';

import { columns as defColumns } from './columns';
import { host as hostColumn } from './columns/host';
import { RemoveButtonMenu } from './RemoveButtonMenu';
import { ImportExportButtons } from './ImportExportButtons';
import { PruneButton } from './PruneButton';

const tableKey = 'images';

export interface TableSettings
  extends
    BasicTableSettings,
    RefreshableTableSettings,
    FilteredColumnsTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  tableKey,
  'tags',
  (set) => ({
    ...refreshableSettings(set),
    ...filteredColumnsSettings(set),
  })
);

export function ImagesDatatable({
  isHostColumnVisible,
}: {
  isHostColumnVisible: boolean;
}) {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, tableKey);
  const columns = useMemo(
    () => (isHostColumnVisible ? [...defColumns, hostColumn] : defColumns),
    [isHostColumnVisible]
  );
  const imagesQuery = useImages(environmentId, true, {});

  return (
    <Datatable
      title="Images"
      titleIcon={List}
      data-cy="docker-images-datatable"
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      renderTableActions={(selectedItems) => (
        <div className="flex items-center gap-2">
          <RemoveButtonMenu selectedItems={selectedItems} />

          <PruneButton images={imagesQuery.data || []} />

          <ImportExportButtons selectedItems={selectedItems} />

          <Authorized authorizations="DockerImageBuild">
            <AddButton
              to="/:endpointId/docker/images/build"
              data-cy="image-buildImageButton"
            >
              Build a new image
            </AddButton>
          </Authorized>
        </div>
      )}
      dataset={imagesQuery.data || []}
      isLoading={imagesQuery.isLoading}
      settingsManager={tableState}
      columns={columns}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
    />
  );
}
