import { Trello } from 'lucide-react';

import { NodeViewModel } from '@/docker/models/node';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { useColumns } from './columns';

const tableKey = 'nodes';

const store = createPersistedStore(tableKey);

export function NodesDatatable({
  dataset,
  isIpColumnVisible,
  haveAccessToNode,
}: {
  dataset?: Array<NodeViewModel>;
  isIpColumnVisible: boolean;
  haveAccessToNode: boolean;
}) {
  const columns = useColumns(isIpColumnVisible);
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable<NodeViewModel>
      disableSelect
      title="Nodes"
      titleIcon={Trello}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'nodes',
          haveAccessToNode,
        })
      )}
      data-cy="swarm-nodes-datatable"
    />
  );
}
