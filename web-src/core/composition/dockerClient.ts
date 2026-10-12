import axios, { parseAxiosError } from '@/shared/http';
import { createDockerClient } from '@/providers/infrastructure/docker';

export const dockerClient = createDockerClient({
  http: axios as unknown as import('@/providers/infrastructure/docker').DockerHttpTransport,
  normalizeError: parseAxiosError,
});
