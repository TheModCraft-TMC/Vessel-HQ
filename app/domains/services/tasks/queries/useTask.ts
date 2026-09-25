import { useQuery } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { TaskId } from '@/domains/services/tasks/types';
import { queryKeys } from '@/domains/services/tasks/queries/query-keys';
import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';

export function useTask(environmentId: EnvironmentId, taskId: TaskId) {
  return useQuery(
    queryKeys.task(environmentId, taskId),

    () => getTask(environmentId, taskId),
    {
      ...withError('Unable to retrieve task'),
    }
  );
}

export async function getTask(environmentId: EnvironmentId, taskId: TaskId) {
  return dockerClient.inspectTask(environmentId, taskId);
}
