import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';

import { Job } from '../types';

import { queryKeys } from './query-keys';

export function useJobs(
  environmentId: EnvironmentId,
  options?: { enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllJobs(environmentId),
    {
      ...withError('Unable to get Jobs'),
      enabled: options?.enabled,
    }
  );
}

async function getAllJobs(environmentId: EnvironmentId) {
  try {
    const { data: jobs } = await axios.get<Job[]>(
      `kubernetes/${environmentId}/jobs`
    );

    return jobs;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get Jobs');
  }
}
