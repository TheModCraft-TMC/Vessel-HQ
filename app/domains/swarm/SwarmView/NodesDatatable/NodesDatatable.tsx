import { Trello } from 'lucide-react';

import { NodeViewModel } from '@/domains/swarm/models/node';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { withMeta } from '@/ui/components/data-table/extend-options/withMeta';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';

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
