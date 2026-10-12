import { EdgeJob } from '../../../models/edge-job';
import { queryKeys as edgeJobQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (id: EdgeJob['Id']) =>
    [...edgeJobQueryKeys.item(id), 'results'] as const,
};
