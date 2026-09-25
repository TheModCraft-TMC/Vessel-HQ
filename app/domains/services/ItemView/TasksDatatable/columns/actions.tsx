import { CellContext } from '@tanstack/react-table';

import { ContainerQuickActions } from '@/domains/containers';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { QuickActionsState } from '@/domains/containers';
import { TaskTableQuickActions } from '@/domains/services/common/TaskTableQuickActions';

import { DecoratedTask } from '../types';

import { columnHelper } from './helper';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedTask, unknown>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }
  const state: QuickActionsState = {
    showQuickActionAttach: false,
    showQuickActionExec: true,
    showQuickActionInspect: true,
    showQuickActionLogs: true,
    showQuickActionStats: true,
  };
  const isAgent = isAgentEnvironment(environmentQuery.data.Type);

  return isAgent && item.Container ? (
    <ContainerQuickActions
      containerId={item.Container.Id}
      nodeName={item.Container.NodeName}
      status={item.Container.Status}
      state={state}
    />
  ) : (
    <TaskTableQuickActions taskId={item.Id} />
  );
}
