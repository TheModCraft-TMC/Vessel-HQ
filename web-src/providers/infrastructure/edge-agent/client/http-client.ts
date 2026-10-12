import http, { parseAxiosError } from '@/shared/http';

/** Transport owned by the Edge Agent provider. Domain code should use its
 * queries/services instead of reaching for the application HTTP singleton. */
export const edgeAgentClient = http;
export { parseAxiosError };
