import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { CronJob } from '../types';

import { queryKeys } from './query-keys';

export function useCronJobs(
  environmentId: EnvironmentId,
  options?: { enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllCronJobs(environmentId),
    {
      ...withError('Unable to get cron jobs'),
      enabled: options?.enabled,
    }
  );
}

async function getAllCronJobs(environmentId: EnvironmentId) {
  try {
    const { data: cronJobs } = await axios.get<CronJob[]>(
      `kubernetes/${environmentId}/cron_jobs`
    );

    return cronJobs;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get cron jobs');
  }
}
