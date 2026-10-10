import { useRouteParams } from '@console/console/routing/useRouteParams';

import LaptopCode from '@/assets/ico/laptop-code.svg?c';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useApplications } from '@/domains/applications';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@/ui/components/data-table/types';

import { useColumns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NodeApplicationsDatatable() {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-node-apps',
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );

  const envId = useEnvironmentId();
  const { nodeName } = useRouteParams();
  const applicationsQuery = useApplications(envId, {
    nodeName,
  });
  const applications = applicationsQuery.data ?? [];

  const columns = useColumns();

  return (
    <Datatable
      dataset={applications}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title="Applications running on this node"
      titleIcon={LaptopCode}
      isLoading={applicationsQuery.isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy="node-applications-datatable"
    />
  );
}
