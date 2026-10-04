import { createColumnHelper } from '@tanstack/react-table';

import type { Event } from '@/domains/clusters/models/event';

export const columnHelper = createColumnHelper<Event>();
