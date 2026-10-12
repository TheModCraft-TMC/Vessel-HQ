import { CellContext } from '@tanstack/react-table';
import { Link } from '@console/navigation/Link';

import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { isAgentEnvironment } from '@/domains/environments';

import { DecoratedTask } from '../../../components/TasksDatatable/types';
import { columnHelper } from '../../../components/TasksDatatable/columns/helper';

export const task = columnHelper.accessor('Id', {
  header: 'Task',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
}: CellContext<DecoratedTask, string>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  const value = getValue();
  const isAgent = isAgentEnvironment(environmentQuery.data.Type);

  return isAgent && item.Container ? (
    <Link
      to="/:endpointId/docker/containers/:id"
      params={{ id: item.Container.Id, nodeName: item.Container.NodeName }}
      className="monospaced"
      data-cy="docker-task-container-link"
    >
      {value}
    </Link>
  ) : (
    <Link
      to="/:endpointId/docker/tasks/:id"
      params={{ id: item.Id }}
      className="monospaced"
      data-cy="docker-task-link"
    >
      {value}
    </Link>
  );
}
