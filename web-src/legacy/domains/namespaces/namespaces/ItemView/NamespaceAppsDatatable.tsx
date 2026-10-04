import { Code } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@/ui/components/data-table/types';
import { useApplications } from '@/domains/applications';

import { useColumns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NamespaceAppsDatatable({ namespace }: { namespace: string }) {
  const environmentId = useEnvironmentId();
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-namespace-apps',
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );

  const applicationsQuery = useApplications(environmentId, {
    namespace,
  });
  const applications = applicationsQuery.data ?? [];

  const columns = useColumns();

  return (
    <Datatable
      dataset={applications}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title="Applications running in this namespace"
      titleIcon={Code}
      isLoading={applicationsQuery.isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy="namespace-apps-datatable"
    />
  );
}
