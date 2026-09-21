import { createColumnHelper } from '@tanstack/react-table';

import { ContainerGroup } from '@/domains/azure/types';

export const columnHelper = createColumnHelper<ContainerGroup>();
