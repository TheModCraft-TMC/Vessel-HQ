import { NestedDatatable } from '@/ui/components/data-table/NestedDatatable';

import { DecoratedTask } from '../../../components/TasksDatatable/types';
import { status } from '../../../components/TasksDatatable/columns/status';
import { actions } from '../../../components/TasksDatatable/columns/actions';
import { slot } from '../../../components/TasksDatatable/columns/slot';
import { node } from '../../../components/TasksDatatable/columns/node';
import { updated } from '../../../components/TasksDatatable/columns/updated';

import { task } from './task-column';

const columns = [status, task, actions, slot, node, updated];

export function TasksDatatable({
  dataset,
  search,
}: {
  dataset: DecoratedTask[];
  search?: string;
}) {
  return (
    <NestedDatatable
      columns={columns}
      dataset={dataset}
      search={search}
      aria-label="Tasks table"
      data-cy="docker-service-tasks-nested-datatable"
      initialSortBy={{ id: 'Updated', desc: true }}
    />
  );
}
