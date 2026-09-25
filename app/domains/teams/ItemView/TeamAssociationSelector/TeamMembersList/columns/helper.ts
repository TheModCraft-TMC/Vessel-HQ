import { createColumnHelper } from '@tanstack/react-table';

import { User } from '@/domains/users';

export const columnHelper = createColumnHelper<User>();
