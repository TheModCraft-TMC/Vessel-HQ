import { parseAxiosError } from '@/shared/http';

/**
 * Adds the Azure ACI operation context at the provider boundary while keeping
 * the configured HTTP client and its error shape out of domain code.
 */
export function parseAzureAciError(error: unknown, message?: string) {
  return parseAxiosError(error, message);
}
