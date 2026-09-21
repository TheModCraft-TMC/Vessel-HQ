import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { createDockerClient } from '@/providers/infrastructure/docker';

export const dockerClient = createDockerClient({
  http: axios,
  normalizeError: parseAxiosError,
});
