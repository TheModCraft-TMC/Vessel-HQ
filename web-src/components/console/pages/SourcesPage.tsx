'use client';

import {
  Source,
  SOURCE_TYPES,
  SourceStatus,
} from '@/domains/gitops/sources/types';
import { SourceCard } from '@/domains/gitops/sources/ListView/SourceCard';
import { useListState } from '@/domains/gitops/sources/ListView/useListState';
import { useSources } from '@/domains/gitops/sources/queries/useSources';
import { useSourcesSummary } from '@/domains/gitops/sources/queries/useSourcesSummary';

import {
  SortableGroup,
  SortableList,
  SortOption,
} from '@@/SortableList/SortableList';
import { StatusSummaryBar } from '@@/StatusSummaryBar/StatusSummaryBar';

const STATUS_CONFIG: Array<{
  key: SourceStatus;
  label: string;
  color: 'error' | 'gray' | 'warning' | 'success';
}> = [
  { key: 'error', label: 'Error', color: 'error' },
  { key: 'paused', label: 'Paused', color: 'gray' },
  { key: 'syncing', label: 'Syncing', color: 'warning' },
  { key: 'healthy', label: 'Healthy', color: 'success' },
  { key: 'unknown', label: 'Unknown', color: 'gray' },
];

const TYPE_CONFIG = Object.entries(SOURCE_TYPES).map(([key, { label }]) => ({
  key,
  label,
}));

const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', grouped: true },
  { key: 'type', label: 'Type', grouped: true },
];

export function SourcesContent() {
  const listState = useListState();
  const sortBy = listState.sortBy?.id ?? 'name';
  const sourcesQuery = useSources({
    search: listState.search || undefined,
    sort: sortBy,
    order: listState.sortBy?.desc ? 'desc' : 'asc',
    start: listState.page * listState.pageSize,
    limit: listState.pageSize,
    status: listState.status ?? undefined,
    type: listState.type ?? undefined,
  });
  const summaryQuery = useSourcesSummary();
  const statusSegments = STATUS_CONFIG.map((status) => ({
    ...status,
    count: summaryQuery.data?.[status.key] ?? 0,
  }));
  const summaryTotal = summaryQuery.data
    ? Object.values(summaryQuery.data).reduce(
        (total, count) => total + count,
        0
      )
    : 0;

  return (
    <div className="mx-4 mb-4 space-y-4">
        <StatusSummaryBar
          total={summaryTotal}
          segments={statusSegments}
          value={listState.status}
          onChange={listState.setStatus}
          radioGroupName="sources-status"
          isLoading={summaryQuery.isLoading}
        />
        <SortableList
          tableState={listState}
          sortOptions={SORT_OPTIONS}
          groupOptions={{
            status: statusSegments,
            type: TYPE_CONFIG,
          }}
          groups={buildSourceGroups(sourcesQuery.data?.data, sortBy)}
          totalCount={sourcesQuery.data?.totalCount ?? 0}
          isLoading={sourcesQuery.isLoading}
          getItemKey={(source) => source.id}
          showGroupHeaders
          emptyMessage="No sources found"
          searchPlaceholder="Search"
          renderItem={(source) => <SourceCard item={source} />}
          data-cy="sources-list"
        />
      </div>
  );
}

function buildSourceGroups(
  sources: Source[] | null | undefined,
  sortBy: string
): SortableGroup<Source>[] {
  if (!sources?.length) return [];

  const config =
    sortBy === 'status'
      ? STATUS_CONFIG
      : sortBy === 'type'
        ? TYPE_CONFIG
        : undefined;

  if (!config) return [{ key: 'all', label: 'All', items: sources }];

  function getGroupKey(source: Source) {
    return sortBy === 'status' ? source.status : source.type;
  }

  return config
    .map(({ key, label }) => ({
      key,
      label,
      items: sources.filter((source) => getGroupKey(source) === key),
    }))
    .filter((group) => group.items.length > 0);
}
