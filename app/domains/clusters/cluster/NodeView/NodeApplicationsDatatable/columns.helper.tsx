import { createColumnHelper } from '@tanstack/react-table';

import type { Application } from '@/domains/applications';

export const helper = createColumnHelper<Application>();
