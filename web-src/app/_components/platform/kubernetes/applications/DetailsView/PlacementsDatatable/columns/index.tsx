import { buildExpandColumn } from '@/ui/components/data-table/expand-column';

import { NodePlacementRowData } from '../../types';

import { columnHelper } from './helper';
import { status } from './status';

export const columns = [
  buildExpandColumn<NodePlacementRowData>(),
  status,
  columnHelper.accessor('name', {
    header: 'Node',
    id: 'node',
  }),
];
