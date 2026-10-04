import _ from 'lodash';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { TaskId, TaskLogsParams } from '@/domains/services/tasks/types';

export async function getTaskLogs(
  environmentId: EnvironmentId,
  taskId: TaskId,
  params?: TaskLogsParams
): Promise<string> {
  return dockerClient.getTaskLogs(environmentId, taskId, _.pickBy(params));
}
