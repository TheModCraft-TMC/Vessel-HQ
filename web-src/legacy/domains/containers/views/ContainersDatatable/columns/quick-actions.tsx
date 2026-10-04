import { CellContext } from '@tanstack/react-table';

import { useAuthorizations } from '@/react/hooks/useUser';
import { ContainerQuickActions } from '@/domains/containers/components/ContainerQuickActions';
import { ContainerListViewModel } from '@/domains/containers/types';
import { useTableSettings } from '@/ui/components/data-table/useTableSettings';

import { TableSettings } from '../types';

import { columnHelper } from './helper';

export const quickActions = columnHelper.display({
  header: 'Quick Actions',
  id: 'actions',
  cell: QuickActionsCell,
});

function QuickActionsCell({
  row: { original: container },
}: CellContext<ContainerListViewModel, unknown>) {
  const settings = useTableSettings<TableSettings>();

  const { hiddenQuickActions = [] } = settings;

  const wrapperState = {
    showQuickActionAttach: !hiddenQuickActions.includes('attach'),
    showQuickActionExec: !hiddenQuickActions.includes('exec'),
    showQuickActionInspect: !hiddenQuickActions.includes('inspect'),
    showQuickActionLogs: !hiddenQuickActions.includes('logs'),
    showQuickActionStats: !hiddenQuickActions.includes('stats'),
  };

  const someOn =
    wrapperState.showQuickActionAttach ||
    wrapperState.showQuickActionExec ||
    wrapperState.showQuickActionInspect ||
    wrapperState.showQuickActionLogs ||
    wrapperState.showQuickActionStats;

  const { authorized } = useAuthorizations([
    'DockerContainerStats',
    'DockerContainerLogs',
    'DockerExecStart',
    'DockerContainerInspect',
    'DockerTaskInspect',
    'DockerTaskLogs',
  ]);

  if (!someOn || !authorized) {
    return null;
  }

  return (
    <ContainerQuickActions
      containerId={container.Id}
      nodeName={container.NodeName}
      status={container.Status}
      state={wrapperState}
    />
  );
}
