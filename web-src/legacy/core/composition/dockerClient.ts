import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { createDockerClient } from '@/providers/infrastructure/docker';

export const dockerClient = createDockerClient({
  http: axios as unknown as import('@/providers/infrastructure/docker').DockerHttpTransport,
  normalizeError: parseAxiosError,
});
