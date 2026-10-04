'use client';

import { useMemo } from 'react';

import { useWorkflowsSummary } from '@/domains/gitops/queries/useWorkflowsSummary';
import { WorkflowCard } from '@/domains/gitops/workflows/ListView/WorkflowCard';
import {
  SORT_KEYS,
  useListState,
} from '@/domains/gitops/workflows/ListView/useListState';
import { useWorkflows } from '@/domains/gitops/workflows/queries/useWorkflows';
import { effectiveWorkflowStatus } from '@/domains/gitops/workflows/status';
import { Workflow, WorkflowStatus } from '@/domains/gitops/workflows/types';
import { asEnum } from '@/ui/components/data-table/useTableStateFromUrl';

import {
  SortableGroup,
  SortableList,
  SortOption,
} from '@@/SortableList/SortableList';
import { StatusSummaryBar } from '@@/StatusSummaryBar/StatusSummaryBar';

const STATUS_CONFIG: Array<{
  key: WorkflowStatus;
  label: string;
  color: 'error' | 'gray' | 'warning' | 'success';
}> = [
  { key: 'error', label: 'Error', color: 'error' },
  { key: 'paused', label: 'Paused', color: 'gray' },
  { key: 'syncing', label: 'Syncing', color: 'warning' },
  { key: 'healthy', label: 'Healthy', color: 'success' },
  { key: 'unknown', label: 'Unknown', color: 'gray' },
];

const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', grouped: true },
  { key: 'lastSyncDate', label: 'Last sync' },
];

const SORT_KEY_SET = new Set(SORT_KEYS);

export function WorkflowsContent() {
  const listState = useListState();
  const sortBy = listState.sortBy?.id ?? 'name';
  const workflowsQuery = useWorkflows({
    search: listState.search || undefined,
    sort: asEnum(sortBy, SORT_KEY_SET) ?? 'name',
    order: listState.sortBy?.desc ? 'desc' : 'asc',
    start: listState.page * listState.pageSize,
    limit: listState.pageSize,
    status: listState.status ?? undefined,
  });
  const summaryQuery = useWorkflowsSummary();
  const statusSegments = STATUS_CONFIG.map((status) => ({
    ...status,
    count: summaryQuery.data?.[status.key] ?? 0,
  }));
  const groups = useMemo(
    () => buildWorkflowGroups(workflowsQuery.data?.data, sortBy),
    [workflowsQuery.data?.data, sortBy]
  );
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
          radioGroupName="workflows-status"
          isLoading={summaryQuery.isLoading}
        />
        <SortableList
          tableState={listState}
          sortOptions={SORT_OPTIONS}
          groupOptions={{ status: statusSegments }}
          groups={groups}
          totalCount={workflowsQuery.data?.totalCount ?? 0}
          isLoading={workflowsQuery.isLoading}
          getItemKey={(workflow) => `workflow-${workflow.id}`}
          showGroupHeaders
          emptyMessage="No workflows found"
          searchPlaceholder="Search"
          renderItem={(workflow) => <WorkflowCard item={workflow} />}
          data-cy="workflows-list"
        />
      </div>
  );
}

function buildWorkflowGroups(
  workflows: Workflow[] | null = [],
  sortBy: string
): SortableGroup<Workflow>[] {
  if (!workflows?.length) return [];
  if (sortBy !== 'status') {
    return [{ key: 'all', label: 'All', items: workflows }];
  }

  return STATUS_CONFIG.map(({ key, label }) => ({
    key,
    label,
    items: workflows.filter(
      (workflow) => effectiveWorkflowStatus(workflow).status === key
    ),
  })).filter((group) => group.items.length > 0);
}
