'use client';

import { useState } from 'react';

import { ActivityLogsTable } from '@/react/portainer/logs/ActivityLogsView/ActivityLogsTable';
import { FilterBar } from '@/react/portainer/logs/ActivityLogsView/FilterBar';
import {
  getSortType,
  useActivityLogs,
} from '@/react/portainer/logs/ActivityLogsView/useActivityLogs';
import { useExportMutation } from '@/react/portainer/logs/ActivityLogsView/useExportMutation';
import { useTableStateWithoutStorage } from '@/ui/components/data-table/useTableState';

type DateRange = { start: Date; end: Date | null };

export function ActivityLogsContent() {
  const exportLogs = useExportMutation();
  const [range, setRange] = useState<DateRange>();
  const [page, setPage] = useState(0);
  const tableState = useTableStateWithoutStorage('Timestamp', true);
  const query = {
    offset: page * tableState.pageSize,
    limit: tableState.pageSize,
    sortBy: getSortType(tableState.sortBy?.id),
    sortDesc: tableState.sortBy?.desc,
    keyword: tableState.search,
    ...(range
      ? {
          after: toSeconds(range.start.valueOf()),
          before: toSeconds(range.end?.valueOf()),
        }
      : undefined),
  };
  const logsQuery = useActivityLogs(query);

  return (
    <div className="mx-4">
        <div className="row">
          <div className="col-sm-12">
            <FilterBar
              value={range}
              onChange={setRange}
              onExport={() => exportLogs.mutate(query)}
            />
          </div>
        </div>
        <ActivityLogsTable
          sort={tableState.sortBy}
          onChangeSort={(value) =>
            tableState.setSortBy(value?.id, value?.desc || false)
          }
          limit={tableState.pageSize}
          onChangeLimit={tableState.setPageSize}
          keyword={tableState.search}
          onChangeKeyword={tableState.setSearch}
          currentPage={page}
          onChangePage={setPage}
          totalItems={logsQuery.data?.totalCount || 0}
          dataset={logsQuery.data?.logs}
        />
      </div>
  );
}

function toSeconds(milliseconds?: number) {
  return milliseconds ? Math.floor(milliseconds / 1000) : undefined;
}
