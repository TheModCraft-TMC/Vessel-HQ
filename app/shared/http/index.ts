/**
 * Compatibility gateway to Portainer's configured HTTP client.
 *
 * Provider clients import the configured transport through this shared module
 * while the legacy Axios setup is migrated out of the application tree. Remove
 * this gateway once the configured client has a permanent shared owner.
 */
export { parseAxiosError } from '@/portainer/services/axios/axios';
// eslint-disable-next-line no-restricted-exports
export { default } from '@/portainer/services/axios/axios';
