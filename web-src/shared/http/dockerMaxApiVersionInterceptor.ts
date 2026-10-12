import Axios, { type InternalAxiosRequestConfig } from 'axios';
import { buildMemoryStorage, setupCache } from 'axios-cache-interceptor';

import {
  buildDockerProxyUrl,
  type SystemVersion,
} from '@/providers/infrastructure/docker';

import { MAX_DOCKER_API_VERSION } from './dockerMaxApiVersion';

const envVersionAxios = Axios.create({ baseURL: '/api' });
const envVersionCache = buildMemoryStorage();
setupCache(envVersionAxios, {
  storage: envVersionCache,
  ttl: 5 * 60 * 1000,
  methods: ['get'],
});

export async function dockerMaxAPIVersionInterceptor(
  rawConfig: InternalAxiosRequestConfig
) {
  try {
    const config = rawConfig;
    const found = config.url?.match(
      /endpoints\/(?<environmentId>\d+)\/docker\//
    );

    if (found?.groups) {
      const envId = parseInt(found.groups.environmentId, 10);
      if (Number.isNaN(envId)) {
        return config;
      }

      const { data } = await envVersionAxios.get<SystemVersion>(
        buildDockerProxyUrl(envId, 'version')
      );
      const apiVersion = parseFloat(data.ApiVersion ?? '0');

      if (apiVersion > MAX_DOCKER_API_VERSION) {
        config.url = config.url?.replace(
          /docker/,
          `docker/v${MAX_DOCKER_API_VERSION}`
        );
      }
    }

    return config;
  } catch {
    return rawConfig;
  }
}
