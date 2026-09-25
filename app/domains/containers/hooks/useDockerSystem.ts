import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import {
  getDockerSystemCapabilities,
  type DockerSystemInfo,
  type DockerSystemVersion,
} from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';

export function useInfo<TSelect = DockerSystemInfo>(
  environmentId?: EnvironmentId,
  {
    enabled,
    select,
  }: { select?: (info: DockerSystemInfo) => TSelect; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['environment', environmentId, 'docker', 'info'],
    queryFn: () => dockerClient.getInfo(environmentId!),
    select,
    enabled: !!environmentId && enabled,
  });
}

export function useVersion<TSelect = DockerSystemVersion>(
  environmentId?: EnvironmentId,
  select?: (info: DockerSystemVersion) => TSelect
) {
  return useQuery({
    queryKey: ['environment', environmentId, 'docker', 'version'],
    queryFn: () => dockerClient.getVersion(environmentId!),
    select,
    enabled: !!environmentId,
  });
}

export function useApiVersion(environmentId?: EnvironmentId) {
  const query = useVersion(environmentId, (info) => info.ApiVersion);
  return query.data ? parseFloat(query.data) : 0;
}

export function useIsWindows(environmentId: EnvironmentId) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isWindows,
  });
  return !!query.data;
}

export function useIsStandalone(
  environmentId?: EnvironmentId,
  options: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isStandalone,
    enabled: options.enabled,
  });
  return !!query.data;
}

export function useIsSwarm(
  environmentId?: EnvironmentId,
  options: { enabled?: boolean } = {}
) {
  const query = useInfo(environmentId, {
    select: (info) => getDockerSystemCapabilities(info).isSwarm,
    enabled: options.enabled,
  });
  return !!query.data;
}

export function useSystemLimits(environmentId: EnvironmentId) {
  const query = useInfo(environmentId);
  const capabilities = query.data
    ? getDockerSystemCapabilities(query.data)
    : undefined;
  return {
    maxCpu: capabilities?.maxCpu ?? 32,
    maxMemory: capabilities?.maxMemory ?? 32768,
  };
}
