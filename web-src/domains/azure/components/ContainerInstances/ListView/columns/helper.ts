import { createColumnHelper } from '@tanstack/react-table';

import { ContainerGroup } from '@/domains/azure/models';

export const columnHelper = createColumnHelper<ContainerGroup>();
