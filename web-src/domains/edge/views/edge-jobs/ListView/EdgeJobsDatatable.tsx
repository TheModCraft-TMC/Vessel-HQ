import { Clock } from 'lucide-react';

import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { useEdgeJobs } from '@/domains/edge/queries/edge-jobs/useEdgeJobs';

import { TableActions } from './TableActions';
import { columns } from './columns';

const tableKey = 'edge-jobs';

const settingsStore = createPersistedStore(tableKey);

export function EdgeJobsDatatable() {
  const jobsQuery = useEdgeJobs();
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <Datatable
      columns={columns}
      isLoading={jobsQuery.isLoading}
      dataset={jobsQuery.data || []}
      settingsManager={tableState}
      title="Edge Jobs"
      titleIcon={Clock}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} />
      )}
      data-cy="edge-jobs-datatable"
    />
  );
}
