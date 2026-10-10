import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useHelmRelease } from '@/domains/configuration/helm/helmReleaseQueries/useHelmRelease';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import {
  createPersistedStore,
  refreshableSettings,
  TableSettingsWithRefreshable,
} from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { Widget } from '@@/Widget';

import { columns } from './columns';
import { useResourceRows } from './useResourceRows';

const storageKey = 'helm-resources';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettingsWithRefreshable>(
    storageKey,
    'name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
}

const settingsStore = createStore('helm-resources');

export function ResourcesTable() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const { name, namespace, revision } = params;
  const revisionNumber = revision ? parseInt(revision, 10) : undefined;

  const tableState = useTableState(settingsStore, storageKey);
  const helmReleaseQuery = useHelmRelease(environmentId, name, namespace, {
    showResources: true,
    revision: revisionNumber,
  });
  const rows = useResourceRows(helmReleaseQuery.data?.info?.resources);

  return (
    <Widget>
      <Datatable
        // no widget to avoid extra padding from app/ui/components/data-table/TableContainer.tsx
        noWidget
        isLoading={helmReleaseQuery.isLoading}
        dataset={rows}
        columns={columns}
        includeSearch
        settingsManager={tableState}
        emptyContentLabel="No resources found"
        title={
          <TextTip inline color="blue" className="!text-xs">
            Only resources currently in the cluster will be displayed.
          </TextTip>
        }
        disableSelect
        getRowId={(row) => row.id}
        data-cy="helm-resources-datatable"
        renderTableSettings={() => (
          <TableSettingsMenu>
            <TableSettingsMenuAutoRefresh
              value={tableState.autoRefreshRateMS}
              onChange={(value) => tableState.setAutoRefreshRate(value)}
            />
          </TableSettingsMenu>
        )}
      />
    </Widget>
  );
}
