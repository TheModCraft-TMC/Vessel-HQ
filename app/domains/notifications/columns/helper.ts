import { createColumnHelper } from '@tanstack/react-table';

import { ToastNotification } from '@/ui/components/toast/types';

export const columnHelper = createColumnHelper<ToastNotification>();
