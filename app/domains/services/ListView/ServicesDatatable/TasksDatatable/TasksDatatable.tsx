import { DecoratedTask } from '@/domains/services/ItemView/TasksDatatable/types';
import { status } from '@/domains/services/ItemView/TasksDatatable/columns/status';
import { actions } from '@/domains/services/ItemView/TasksDatatable/columns/actions';
import { slot } from '@/domains/services/ItemView/TasksDatatable/columns/slot';
import { node } from '@/domains/services/ItemView/TasksDatatable/columns/node';
import { updated } from '@/domains/services/ItemView/TasksDatatable/columns/updated';
import { NestedDatatable } from '@/ui/components/data-table/NestedDatatable';

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
