import { createColumnHelper } from '@tanstack/react-table';

import { ServiceViewModel } from '@/domains/services/models/service';

export const columnHelper = createColumnHelper<ServiceViewModel>();
