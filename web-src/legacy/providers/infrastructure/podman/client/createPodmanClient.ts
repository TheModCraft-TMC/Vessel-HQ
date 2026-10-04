import type { DockerClient } from '@/providers/infrastructure/docker';

export type PodmanClient = Pick<
  DockerClient,
  | 'getInfo'
  | 'getVersion'
  | 'listContainers'
  | 'inspectContainer'
  | 'listNetworks'
  | 'listTasks'
  | 'getContainerStats'
  | 'startContainer'
  | 'stopContainer'
  | 'restartContainer'
  | 'removeContainer'
>;

/** Podman exposes the Docker compatible API for the shared operations. */
export function createPodmanClient(dockerClient: DockerClient): PodmanClient {
  return dockerClient;
}
