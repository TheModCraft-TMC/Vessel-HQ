import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { NestedDatatable } from '@/ui/components/data-table/NestedDatatable';
import { useIsSwarm } from '@/core/composition/useDockerInfo';

import { useColumns } from './columns';
import { DecoratedNetwork } from './types';

export function NestedNetworksDatatable({
  dataset,
}: {
  dataset: Array<DecoratedNetwork>;
}) {
  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarm(environmentId);

  const columns = useColumns(isSwarm);
  return (
    <NestedDatatable
      columns={columns}
      dataset={dataset}
      aria-label="Networks table"
      data-cy="docker-networks-nested-datatable"
    />
  );
}
