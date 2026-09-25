import { useQuery } from '@tanstack/react-query';

import { useApplicationBindings } from '@/core/composition';
import { EnvironmentId } from '@/domains/environments';
import {
  getDockerSystemCapabilities,
  type DockerSystemInfo,
  type DockerSystemVersion,
  type DockerSwarmDto,
  type DockerTaskDto,
} from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';

export const dockerQueryKeys = {
  root: (environmentId: EnvironmentId) => ['docker', environmentId] as const,
  info: (environmentId?: EnvironmentId) =>
    ['environment', environmentId, 'docker', 'info'] as const,
  version: (environmentId?: EnvironmentId) =>
    ['environment', environmentId, 'docker', 'version'] as const,
  swarm: (environmentId: EnvironmentId) =>
    ['environment', environmentId, 'docker', 'swarm'] as const,
  tasks: (environmentId: EnvironmentId, filters?: unknown) =>
    ['environment', environmentId, 'docker', 'tasks', filters] as const,
};

export async function getInfo(environmentId: EnvironmentId) {
  return dockerClient.getInfo(environmentId);
}

export function useInfo<TSelect = DockerSystemInfo>(
  environmentId?: EnvironmentId,
  options: {
    select?: (info: DockerSystemInfo) => TSelect;
    enabled?: boolean;
  } = {}
) {
  const { infrastructure } = useApplicationBindings();

  return useQuery({
    queryKey: dockerQueryKeys.info(environmentId),
    queryFn: () => infrastructure.docker.getInfo(environmentId!),
    select: options.select,
    enabled: !!environmentId && options.enabled,
  });
}

export function useIsStandalone(
  environmentId: EnvironmentId | undefined,
  options: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    ...options,
    select: (info) => getDockerSystemCapabilities(info).isStandalone,
  });
  return !!query.data;
}

export function useIsSwarmManager(
  environmentId?: EnvironmentId,
  options: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    ...options,
    select: (info) => getDockerSystemCapabilities(info).isSwarmManager,
  });
  return !!query.data;
}

export function useApiVersion(environmentId?: EnvironmentId) {
  const { infrastructure } = useApplicationBindings();

  const query = useQuery({
    queryKey: dockerQueryKeys.version(environmentId),
    queryFn: () => infrastructure.docker.getVersion(environmentId!),
    enabled: !!environmentId,
    select: (info: DockerSystemVersion) => info.ApiVersion,
  });
  return query.data ? parseFloat(query.data) : 0;
}

export async function getSwarm(environmentId: EnvironmentId) {
  return dockerClient.getSwarm(environmentId);
}

export function useSwarmId(environmentId: EnvironmentId) {
  const { infrastructure } = useApplicationBindings();
  const isSwarmManager = useIsSwarmManager(environmentId);
  return useQuery({
    queryKey: dockerQueryKeys.swarm(environmentId),
    queryFn: () => infrastructure.docker.getSwarm(environmentId),
    enabled: isSwarmManager,
    select: (swarm: DockerSwarmDto) => swarm.ID,
  });
}

export type DockerTaskFilters = {
  'desired-state'?: Array<'running' | 'shutdown' | 'accepted'>;
  id?: string[];
  label?: string[];
  name?: string[];
  node?: string[];
  service?: string[];
};

export function useTasks<T = DockerTaskDto>(
  {
    environmentId,
    filters,
  }: { environmentId: EnvironmentId; filters?: DockerTaskFilters },
  options: { enabled?: boolean; select?: (data: DockerTaskDto[]) => T } = {}
) {
  const { infrastructure } = useApplicationBindings();

  return useQuery({
    queryKey: dockerQueryKeys.tasks(environmentId, filters),
    queryFn: () =>
      infrastructure.docker.listTasks(environmentId, {
        filters: filters && JSON.stringify(filters),
      }),
    enabled: options.enabled,
    select: options.select,
  });
}
