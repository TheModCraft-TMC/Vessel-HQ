import { parseAxiosError } from '@/shared/http';

export function parseKubernetesError(error: unknown, message = '') {
  return parseAxiosError(error, message);
}
