import { useQuery } from '@tanstack/react-query';
import { Task } from '@/providers/infrastructure/docker';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export function useTasks<T = Task>(
  {
    environmentId,
    filters,
  }: { environmentId: EnvironmentId; filters?: Record<string, unknown> },
  options: { enabled?: boolean; select?: (data: Task[]) => T } = {}
) {
  return useQuery({
    queryKey: ['docker', environmentId, 'tasks', filters],
    queryFn: () =>
      dockerClient.listTasks(environmentId, {
        filters: filters ? JSON.stringify(filters) : undefined,
      }),
    enabled: options.enabled,
    select: options.select,
  });
}

export function getTasks(
  environmentId: EnvironmentId,
  filters?: Record<string, unknown>
) {
  return dockerClient.listTasks(environmentId, {
    filters: filters ? JSON.stringify(filters) : undefined,
  });
}
