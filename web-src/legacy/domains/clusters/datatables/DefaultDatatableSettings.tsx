import { TableSettingsMenuAutoRefresh } from '@/ui/components/data-table/TableSettingsMenuAutoRefresh';
import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@/ui/components/data-table/types';

import {
  SystemResourcesSettings,
  SystemResourcesTableSettings,
} from './SystemResourcesSettings';

export interface TableSettings
  extends
    BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

export function DefaultDatatableSettings({
  settings,
}: {
  settings: TableSettings;
}) {
  return (
    <>
      <SystemResourcesSettings
        value={settings.showSystemResources}
        onChange={(value) => {
          settings.setShowSystemResources(value);
        }}
      />

      <TableSettingsMenuAutoRefresh
        value={settings.autoRefreshRateMS}
        onChange={handleRefreshRateChange}
      />
    </>
  );

  function handleRefreshRateChange(autoRefreshRate: number) {
    settings.setAutoRefreshRate(autoRefreshRate);
  }
}
