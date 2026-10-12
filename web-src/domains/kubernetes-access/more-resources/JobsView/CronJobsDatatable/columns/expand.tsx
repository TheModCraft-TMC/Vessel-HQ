import { buildExpandColumn } from '@/ui/components/data-table/expand-column';

import { CronJob } from '../types';

import { columnHelper } from './helper';

export const expand = columnHelper.display({
  ...buildExpandColumn<CronJob>(),
  id: 'expand',
});
