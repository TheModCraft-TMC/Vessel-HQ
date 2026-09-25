import { createColumnHelper } from '@tanstack/react-table';

import { NodeViewModel } from '@/domains/swarm/models/node';

export const columnHelper = createColumnHelper<NodeViewModel>();
