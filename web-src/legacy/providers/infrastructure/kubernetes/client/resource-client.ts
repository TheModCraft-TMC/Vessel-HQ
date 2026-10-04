import http from '@/shared/http';

import { parseKubernetesError } from '../errors/parse-kubernetes-error';

export interface KubernetesRequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface KubernetesHttpTransport {
  get<T>(url: string, options?: KubernetesRequestOptions): Promise<{ data: T }>;
  post?<T = unknown>(
    url: string,
    data?: unknown,
    options?: KubernetesRequestOptions
  ): Promise<{ data: T }>;
  put?<T = unknown>(
    url: string,
    data?: unknown,
    options?: KubernetesRequestOptions
  ): Promise<{ data: T }>;
  patch?<T = unknown>(
    url: string,
    data?: unknown,
    options?: KubernetesRequestOptions
  ): Promise<{ data: T }>;
  delete?<T = unknown>(
    url: string,
    options?: KubernetesRequestOptions
  ): Promise<{ data: T }>;
}

export interface KubernetesResourceClient {
  get<T>(
    path: string,
    options?: KubernetesRequestOptions,
    message?: string
  ): Promise<T>;
  post<T>(
    path: string,
    data?: unknown,
    options?: KubernetesRequestOptions,
    message?: string
  ): Promise<T>;
  put<T>(
    path: string,
    data?: unknown,
    options?: KubernetesRequestOptions,
    message?: string
  ): Promise<T>;
  patch<T>(
    path: string,
    data?: unknown,
    options?: KubernetesRequestOptions,
    message?: string
  ): Promise<T>;
  delete<T>(
    path: string,
    options?: KubernetesRequestOptions,
    message?: string
  ): Promise<T>;
}

export function createKubernetesResourceClient(
  transport: KubernetesHttpTransport = http
): KubernetesResourceClient {
  return {
    get: (path, options, message) =>
      request(transport, 'get', path, undefined, options, message),
    post: (path, data, options, message) =>
      request(transport, 'post', path, data, options, message),
    put: (path, data, options, message) =>
      request(transport, 'put', path, data, options, message),
    patch: (path, data, options, message) =>
      request(transport, 'patch', path, data, options, message),
    delete: (path, options, message) =>
      request(transport, 'delete', path, undefined, options, message),
  };
}

async function request<T>(
  transport: KubernetesHttpTransport,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  data?: unknown,
  options?: KubernetesRequestOptions,
  message = 'Unable to complete Kubernetes request'
): Promise<T> {
  try {
    const requestMethod = transport[method];
    if (!requestMethod) {
      throw new Error(`Kubernetes transport does not implement ${method}`);
    }

    const invoke = requestMethod as (
      url: string,
      dataOrOptions?: unknown,
      options?: KubernetesRequestOptions
    ) => Promise<{ data: T }>;
    const response = await (method === 'get' || method === 'delete'
      ? invoke(path, options)
      : invoke(path, data, options));
    return response.data as T;
  } catch (error) {
    throw parseKubernetesError(error, message);
  }
}

export const kubernetesResourceClient = createKubernetesResourceClient();
