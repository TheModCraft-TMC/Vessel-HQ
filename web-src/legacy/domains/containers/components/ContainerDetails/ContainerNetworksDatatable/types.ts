import { TableMeta } from '@tanstack/react-table';

import type { ContainerNetwork } from '@/domains/containers/models';

export type TableNetwork = ContainerNetwork & { id: string; name: string };

export type ContainerNetworkTableMeta = TableMeta<TableNetwork> & {
  table: 'container-networks';
  containerId: string;
};

export function isContainerNetworkTableMeta(
  meta?: TableMeta<TableNetwork>
): meta is ContainerNetworkTableMeta {
  return !!meta && 'table' in meta && meta.table === 'container-networks';
}
