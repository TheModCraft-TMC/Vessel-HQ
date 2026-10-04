import { useQuery } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { withPaginationHeaders } from '@/react/common/api/pagination.types';
import {
  BaseQueryOptions,
  BaseQueryParams,
  queryParamsFromQueryOptions,
} from '@/react/common/api/listQueryParams';

import { EdgeJob, JobResult } from '../../../models/edge-job';
import { sortOptions } from '../../../views/edge-jobs/ItemView/ResultsDatatable/columns';

import { queryKeys } from './query-keys';

type QueryOptions = BaseQueryOptions<typeof sortOptions>;

export function useJobResults(id: EdgeJob['Id'], query: QueryOptions = {}) {
  return useQuery({
    queryKey: [...queryKeys.base(id), query],
    queryFn: () => getJobResults(id, queryParamsFromQueryOptions(query)),
  });
}

type QueryParams = BaseQueryParams<typeof sortOptions>;

async function getJobResults(id: EdgeJob['Id'], params?: QueryParams) {
  try {
    const response = await axios.get<Array<JobResult>>(
      `edge_jobs/${id}/tasks`,
      { params }
    );

    return withPaginationHeaders(response);
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job results');
  }
}
