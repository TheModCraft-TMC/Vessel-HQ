import http from '@/shared/http';

import { KubernetesApiResourceListDto } from '../dto/discovery';
import { KubernetesEventDto } from '../dto/event';
import { KubernetesNamespaceDto } from '../dto/namespace';
import { KubernetesVersionDto } from '../dto/version';
import { parseKubernetesError } from '../errors/parse-kubernetes-error';
import { mapKubernetesEvent } from '../mappers/event';
import { mapKubernetesNamespace } from '../mappers/namespace';
import { mapKubernetesVersion } from '../mappers/version';
import type { KubernetesHttpTransport } from './resource-client';

type KubernetesReadTransport = Pick<KubernetesHttpTransport, 'get'>;

export type { KubernetesHttpTransport } from './resource-client';

export interface KubernetesClient {
  getVersion(
    environmentId: number
  ): Promise<ReturnType<typeof mapKubernetesVersion>>;
  getEvents(
    environmentId: number,
    options?: { namespace?: string; resourceId?: string }
  ): Promise<ReturnType<typeof mapKubernetesEvent>[]>;
  listNamespaces(
    environmentId: number,
    options?: { withResourceQuota?: boolean; withUnhealthyEvents?: boolean }
  ): Promise<ReturnType<typeof mapKubernetesNamespace>[]>;
  getNamespace(
    environmentId: number,
    namespace: string,
    params?: Record<string, string>
  ): Promise<ReturnType<typeof mapKubernetesNamespace>>;
  discover(
    environmentId: number,
    path?: string
  ): Promise<KubernetesApiResourceListDto>;
  request<T>(
    environmentId: number,
    path: string,
    params?: Record<string, unknown>
  ): Promise<T>;
  watch<T>(
    environmentId: number,
    path: string,
    params?: Record<string, unknown>
  ): Promise<T>;
}

export function createKubernetesClient(
  transport: KubernetesReadTransport = http
): KubernetesClient {
  return {
    async getVersion(environmentId) {
      const data = await get<KubernetesVersionDto>(
        transport,
        `/kubernetes/${environmentId}/version`,
        'Unable to retrieve Kubernetes cluster version'
      );
      return mapKubernetesVersion(data);
    },
    async getEvents(environmentId, options = {}) {
      const path = options.namespace
        ? `/kubernetes/${environmentId}/namespaces/${options.namespace}/events`
        : `/kubernetes/${environmentId}/events`;
      const data = await get<KubernetesEventDto[]>(
        transport,
        path,
        'Unable to retrieve events',
        {
          resourceId: options.resourceId,
        }
      );
      return data.map(mapKubernetesEvent);
    },
    async listNamespaces(environmentId, options = {}) {
      const data = await get<KubernetesNamespaceDto[]>(
        transport,
        `/kubernetes/${environmentId}/namespaces`,
        'Unable to retrieve namespaces',
        options
      );
      return data.map(mapKubernetesNamespace);
    },
    async getNamespace(environmentId, namespace, params) {
      const data = await get<KubernetesNamespaceDto>(
        transport,
        `/kubernetes/${environmentId}/namespaces/${namespace}`,
        'Unable to retrieve namespace',
        params
      );
      return mapKubernetesNamespace(data);
    },
    discover(environmentId, path = 'api/v1') {
      return this.request<KubernetesApiResourceListDto>(environmentId, path);
    },
    request(environmentId, path, params) {
      return get(
        transport,
        `/endpoints/${environmentId}/kubernetes/${path}`,
        'Unable to retrieve Kubernetes API resource',
        params
      );
    },
    watch(environmentId, path, params) {
      return get(
        transport,
        `/endpoints/${environmentId}/kubernetes/${path}`,
        'Unable to watch Kubernetes resource',
        {
          ...params,
          watch: true,
        }
      );
    },
  };
}

async function get<T>(
  transport: KubernetesReadTransport,
  path: string,
  message: string,
  params?: Record<string, unknown>
) {
  try {
    const { data } = await transport.get<T>(path, { params });
    return data;
  } catch (error) {
    throw parseKubernetesError(error, message);
  }
}

export const kubernetesClient = createKubernetesClient();
