import { createColumnHelper } from '@tanstack/react-table';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { buildNameColumn } from '@/ui/components/data-table/buildNameColumn';
import { EdgeJob } from '@/domains/edge/models/edge-job';

const columnHelper = createColumnHelper<EdgeJob>();

export const columns = [
  buildNameColumn<EdgeJob>('Name', '.job', 'edge-job-name'),
  columnHelper.accessor('CronExpression', {
    header: 'Cron Expression',
  }),
  columnHelper.accessor('Created', {
    header: 'Created',
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
];
