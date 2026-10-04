import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

import { ContainerId, ContainerLogsParams } from './types';

export async function startContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.startContainer(environmentId, id, { nodeName });
}

export async function stopContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.stopContainer(endpointId, id, { nodeName });
}

export async function recreateContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  pullImage: boolean,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.recreateContainer(endpointId, id, pullImage, {
    nodeName,
  });
}

export async function restartContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.restartContainer(endpointId, id, { nodeName });
}

export async function killContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.killContainer(endpointId, id, { nodeName });
}

export async function pauseContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.pauseContainer(endpointId, id, { nodeName });
}

export async function resumeContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.resumeContainer(endpointId, id, { nodeName });
}

export async function renameContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  name: string,
  { nodeName }: { nodeName?: string } = {}
) {
  return dockerClient.renameContainer(endpointId, id, name, { nodeName });
}

export async function removeContainer(
  endpointId: EnvironmentId,
  containerId: string,
  {
    nodeName,
    removeVolumes,
  }: { removeVolumes?: boolean; nodeName?: string } = {}
) {
  return dockerClient.removeContainer(endpointId, containerId, {
    nodeName,
    removeVolumes,
  });
}

export async function getContainerLogs(
  environmentId: EnvironmentId,
  containerId: ContainerId,
  params?: ContainerLogsParams
): Promise<string> {
  return dockerClient.getContainerLogs(environmentId, containerId, params);
}
