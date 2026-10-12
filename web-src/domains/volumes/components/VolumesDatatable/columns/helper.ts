import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedVolume } from '../../../models/types';

export const columnHelper = createColumnHelper<DecoratedVolume>();
