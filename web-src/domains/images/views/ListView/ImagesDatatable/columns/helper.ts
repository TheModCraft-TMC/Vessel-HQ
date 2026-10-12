import { createColumnHelper } from '@tanstack/react-table';

import { ImagesListResponse } from '@/domains/images/queries/useImages';

export const columnHelper = createColumnHelper<ImagesListResponse>();
