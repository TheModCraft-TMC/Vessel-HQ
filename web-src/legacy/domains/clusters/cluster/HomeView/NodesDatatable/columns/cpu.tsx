import { parseCPU } from '@/domains/clusters/utils';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const cpu = columnHelper.accessor((row) => getCPU(row), {
  header: 'CPU',
  cell: ({ row: { original: node } }) => getCPU(node),
});

function getCPU(node: NodeRowData) {
  return parseCPU(node.status?.allocatable?.cpu ?? '');
}
