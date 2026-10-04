import type { DockerContainerProcessesDto } from '@/providers/infrastructure/docker';

import type { ContainerProcesses } from '../models';

export function toContainerProcesses(
  response: DockerContainerProcessesDto
): ContainerProcesses {
  return {
    Processes: response.Processes ?? [],
    Titles: response.Titles ?? [],
  };
}
