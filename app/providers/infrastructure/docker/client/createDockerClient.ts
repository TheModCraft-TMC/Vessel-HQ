import { SystemVersion } from 'docker-types';

import { EnvironmentId } from '@/domains/environments';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export interface DockerHttpTransport {
  get<T>(url: string): Promise<{ data: T }>;
}

export type DockerErrorNormalizer = (error: unknown, message?: string) => Error;

interface DockerClientDependencies {
  http: DockerHttpTransport;
  normalizeError: DockerErrorNormalizer;
}

export interface DockerClient {
  getVersion(environmentId: EnvironmentId): Promise<SystemVersion>;
  ping(environmentId: EnvironmentId): Promise<void>;
}

/**
 * Creates the read-only Docker Engine client used by domain-owned queries.
 * The configured HTTP transport is injected by application composition so
 * this provider remains independent from React, query caching, and UI state.
 */
export function createDockerClient({
  http,
  normalizeError,
}: DockerClientDependencies): DockerClient {
  return {
    async getVersion(environmentId) {
      try {
        const { data } = await http.get<SystemVersion>(
          buildDockerProxyUrl(environmentId, 'version')
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve version');
      }
    },

    async ping(environmentId) {
      try {
        await http.get(buildDockerProxyUrl(environmentId, '_ping'));
      } catch (error) {
        throw normalizeError(error);
      }
    },
  };
}
