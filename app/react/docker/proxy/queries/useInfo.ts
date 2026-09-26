import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import {
  getDockerSystemCapabilities,
  type DockerSystemInfo,
} from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';

export async function getInfo(environmentId: EnvironmentId) {
  return dockerClient.getInfo(environmentId);
}

export function useInfo<TSelect = DockerSystemInfo>(
  environmentId?: EnvironmentId,
  {
    enabled,
    select,
  }: { select?: (info: DockerSystemInfo) => TSelect; enabled?: boolean } = {}
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'info'],
    () => getInfo(environmentId!),
    {
      select,
      enabled: !!environmentId && enabled,
    }
  );
}

export function useIsWindows(environmentId: EnvironmentId) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isWindows,
  });

  return !!query.data;
}

export function useIsStandalone(
  environmentId: EnvironmentId | undefined,
  { enabled }: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isStandalone,
    enabled,
  });

  return !!query.data;
}

export function useIsSwarm(
  environmentId?: EnvironmentId,
  { enabled }: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isSwarm,
    enabled,
  });

  return !!query.data;
}

export function useSystemLimits(environmentId: EnvironmentId) {
  const infoQuery = useInfo(environmentId);

  const capabilities = infoQuery.data
    ? getDockerSystemCapabilities(infoQuery.data)
    : undefined;

  return {
    maxCpu: capabilities?.maxCpu ?? 32,
    maxMemory: capabilities?.maxMemory ?? 32768,
  };
}

export function useIsSwarmManager(
  environmentId?: EnvironmentId,
  { enabled }: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isSwarmManager,
    enabled,
  });

  return !!query.data;
}
