import { createColumnHelper } from '@tanstack/react-table';

import { EdgeGroupListItemResponse } from '@/domains/edge/queries/edge-groups/useEdgeGroups';

export const columnHelper = createColumnHelper<EdgeGroupListItemResponse>();
