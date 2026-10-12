import { createColumnHelper } from '@tanstack/react-table';

import { isoDateFromTimestamp } from '@/shared/formatters';

import { AccessToken } from '../../access-tokens/types';

const columnHelper = createColumnHelper<AccessToken>();

export const columns = [
  columnHelper.accessor('description', {
    header: 'Description',
  }),
  columnHelper.accessor('prefix', {
    header: 'Prefix',
  }),
  columnHelper.accessor('dateCreated', {
    header: 'Created',
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
  columnHelper.accessor('lastUsed', {
    header: 'Last Used',
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
];
