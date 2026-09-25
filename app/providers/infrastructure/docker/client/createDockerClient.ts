import type { DockerSystemInfo, DockerSystemVersion } from '../dto/system';
import type {
  DockerContainerDetailsDto,
  DockerContainerDto,
  DockerContainerListOptions,
  DockerContainerProcessesDto,
  DockerNetworkConnectOptions,
  DockerNetworkCreateRequest,
  DockerNetworkCreateResponse,
  DockerNetworkDisconnectOptions,
  DockerNetworkDto,
  DockerNetworkListOptions,
  DockerBuildPruneDto,
  DockerImageHistoryDto,
  DockerImageListDto,
  DockerImagePruneDto,
  DockerImageBuildLogDto,
  DockerServiceDto,
  DockerTaskDto,
  DockerConfigDto,
  DockerSecretDto,
  DockerNodeDto,
  DockerSwarmDto,
  DockerServiceSpecDto,
  DockerConfigSpecDto,
  DockerSecretSpecDto,
  DockerNodeSpecDto,
  EnvironmentId,
} from '../types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export interface DockerHttpTransport {
  get<T>(
    url: string,
    options?: {
      params?: Record<string, unknown>;
      headers?: Record<string, string | undefined>;
      responseType?: string;
      paramsSerializer?: unknown;
    }
  ): Promise<{ data: T }>;
  post<T>(
    url: string,
    body?: unknown,
    options?: {
      params?: Record<string, unknown>;
      headers?: Record<string, string | undefined>;
      responseType?: string;
      paramsSerializer?: unknown;
    }
  ): Promise<{ data: T }>;
  delete<T>(
    url: string,
    options?: {
      params?: Record<string, unknown>;
      headers?: Record<string, string | undefined>;
      responseType?: string;
      paramsSerializer?: unknown;
    }
  ): Promise<{ data: T }>;
}

export type DockerErrorNormalizer = (error: unknown, message?: string) => Error;

interface DockerClientDependencies {
  http: DockerHttpTransport;
  normalizeError: DockerErrorNormalizer;
}

export interface DockerClient {
  getInfo(environmentId: EnvironmentId): Promise<DockerSystemInfo>;
  getVersion(environmentId: EnvironmentId): Promise<DockerSystemVersion>;
  ping(environmentId: EnvironmentId): Promise<void>;
  listContainers(
    environmentId: EnvironmentId,
    options?: DockerContainerListOptions
  ): Promise<DockerContainerDto[]>;
  inspectContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: { nodeName?: string }
  ): Promise<DockerContainerDetailsDto>;
  getContainerTop(
    environmentId: EnvironmentId,
    containerId: string
  ): Promise<DockerContainerProcessesDto>;
  getContainerStats<T>(
    environmentId: EnvironmentId,
    containerId: string,
    options?: { nodeName?: string }
  ): Promise<T>;
  getContainerLogs(
    environmentId: EnvironmentId,
    containerId: string,
    params?: Record<string, unknown>
  ): Promise<string>;
  createContainer<T>(
    environmentId: EnvironmentId,
    config: unknown,
    options?: { nodeName?: string; name?: string }
  ): Promise<T>;
  recreateContainer(
    environmentId: EnvironmentId,
    containerId: string,
    pullImage: boolean,
    options?: { nodeName?: string }
  ): Promise<void>;
  updateContainer(
    environmentId: EnvironmentId,
    containerId: string,
    config: unknown,
    options?: { nodeName?: string }
  ): Promise<void>;
  getImage<T>(
    environmentId: EnvironmentId,
    imageId: string,
    options?: { nodeName?: string }
  ): Promise<T>;
  listImages(
    environmentId: EnvironmentId,
    options?: { withUsage?: boolean }
  ): Promise<DockerImageListDto[]>;
  inspectImage<T>(
    environmentId: EnvironmentId,
    imageId: string,
    options?: { nodeName?: string }
  ): Promise<T>;
  getImageHistory(
    environmentId: EnvironmentId,
    imageId: string,
    options?: { nodeName?: string }
  ): Promise<DockerImageHistoryDto[]>;
  removeImage(
    environmentId: EnvironmentId,
    imageId: string,
    options?: { nodeName?: string; force?: boolean }
  ): Promise<void>;
  tagImage(
    environmentId: EnvironmentId,
    imageId: string,
    options: { repo: string; tag?: string; nodeName?: string }
  ): Promise<void>;
  pullImage(
    environmentId: EnvironmentId,
    options: { image: string; nodeName?: string; registryId?: number }
  ): Promise<unknown>;
  pushImage(
    environmentId: EnvironmentId,
    image: string,
    options?: { nodeName?: string; registryId?: number }
  ): Promise<unknown>;
  pruneImages(
    environmentId: EnvironmentId,
    options?: { all?: boolean }
  ): Promise<DockerImagePruneDto>;
  pruneBuildCache(environmentId: EnvironmentId): Promise<DockerBuildPruneDto>;
  buildImage(
    environmentId: EnvironmentId,
    params: Record<string, unknown>,
    payload: unknown,
    options: { contentType: string; nodeName?: string }
  ): Promise<DockerImageBuildLogDto[]>;
  uploadImage(
    environmentId: EnvironmentId,
    payload: unknown,
    options?: { nodeName?: string; contentType?: string }
  ): Promise<unknown>;
  downloadImages(
    environmentId: EnvironmentId,
    names: string[],
    options?: { nodeName?: string }
  ): Promise<{ data: unknown; headers?: Record<string, string | undefined> }>;
  listServices(
    environmentId: EnvironmentId,
    params?: Record<string, unknown>
  ): Promise<DockerServiceDto[]>;
  inspectService(
    environmentId: EnvironmentId,
    serviceId: string
  ): Promise<DockerServiceDto>;
  createService(
    environmentId: EnvironmentId,
    spec: DockerServiceSpecDto,
    options?: { registryId?: number }
  ): Promise<{ ID: string; Portainer?: { ResourceControl?: { Id?: number } } }>;
  updateService(
    environmentId: EnvironmentId,
    serviceId: string,
    spec: DockerServiceSpecDto,
    version: number,
    options?: { rollback?: 'previous'; registryId?: number }
  ): Promise<unknown>;
  removeService(environmentId: EnvironmentId, serviceId: string): Promise<void>;
  getServiceLogs(
    environmentId: EnvironmentId,
    serviceId: string,
    params?: Record<string, unknown>
  ): Promise<string>;
  listTasks(
    environmentId: EnvironmentId,
    params?: Record<string, unknown>
  ): Promise<DockerTaskDto[]>;
  inspectTask(
    environmentId: EnvironmentId,
    taskId: string
  ): Promise<DockerTaskDto>;
  getTaskLogs(
    environmentId: EnvironmentId,
    taskId: string,
    params?: Record<string, unknown>
  ): Promise<string>;
  listConfigs(environmentId: EnvironmentId): Promise<DockerConfigDto[]>;
  inspectConfig(
    environmentId: EnvironmentId,
    configId: string
  ): Promise<DockerConfigDto>;
  createConfig(
    environmentId: EnvironmentId,
    spec: DockerConfigSpecDto
  ): Promise<{ Id: string; Portainer?: { ResourceControl?: { Id?: number } } }>;
  removeConfig(environmentId: EnvironmentId, configId: string): Promise<void>;
  listSecrets(environmentId: EnvironmentId): Promise<DockerSecretDto[]>;
  inspectSecret(
    environmentId: EnvironmentId,
    secretId: string
  ): Promise<DockerSecretDto>;
  createSecret(
    environmentId: EnvironmentId,
    spec: DockerSecretSpecDto
  ): Promise<{ Id: string }>;
  removeSecret(environmentId: EnvironmentId, secretId: string): Promise<void>;
  getSwarm(environmentId: EnvironmentId): Promise<DockerSwarmDto>;
  listNodes(environmentId: EnvironmentId): Promise<DockerNodeDto[]>;
  inspectNode(
    environmentId: EnvironmentId,
    nodeId: string
  ): Promise<DockerNodeDto>;
  updateNode(
    environmentId: EnvironmentId,
    nodeId: string,
    spec: DockerNodeSpecDto,
    version: number
  ): Promise<void>;
  resizeExec(
    environmentId: EnvironmentId,
    execId: string,
    dimensions: { width: number; height: number }
  ): Promise<void>;
  commitContainer<T>(
    environmentId: EnvironmentId,
    params: Record<string, unknown>
  ): Promise<T>;
  startContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  stopContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  restartContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  pauseContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  resumeContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  killContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  renameContainer(
    environmentId: EnvironmentId,
    containerId: string,
    name: string,
    options?: DockerContainerActionOptions
  ): Promise<void>;
  removeContainer(
    environmentId: EnvironmentId,
    containerId: string,
    options?: DockerContainerRemoveOptions
  ): Promise<void>;
  listNetworks(
    environmentId: EnvironmentId,
    options?: DockerNetworkListOptions
  ): Promise<DockerNetworkDto[]>;
  inspectNetwork(
    environmentId: EnvironmentId,
    networkId: string,
    options?: { nodeName?: string }
  ): Promise<DockerNetworkDto>;
  createNetwork(
    environmentId: EnvironmentId,
    request: DockerNetworkCreateRequest,
    options?: { nodeName?: string; agentManagerOperation?: boolean }
  ): Promise<DockerNetworkCreateResponse>;
  removeNetwork(
    environmentId: EnvironmentId,
    networkId: string,
    options?: { nodeName?: string }
  ): Promise<void>;
  connectContainerToNetwork(
    environmentId: EnvironmentId,
    options: DockerNetworkConnectOptions
  ): Promise<void>;
  disconnectContainerFromNetwork(
    environmentId: EnvironmentId,
    options: DockerNetworkDisconnectOptions
  ): Promise<void>;
}

export interface DockerContainerActionOptions {
  nodeName?: string;
}

export interface DockerContainerRemoveOptions extends DockerContainerActionOptions {
  removeVolumes?: boolean;
}

/**
 * Creates the Docker Engine client used by domain-owned queries and actions.
 * The configured HTTP transport is injected by application composition so
 * this provider remains independent from React, query caching, and UI state.
 */
export function createDockerClient({
  http,
  normalizeError,
}: DockerClientDependencies): DockerClient {
  return {
    async getInfo(environmentId) {
      try {
        const { data } = await http.get<DockerSystemInfo>(
          buildDockerProxyUrl(environmentId, 'info')
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve system info');
      }
    },

    async getVersion(environmentId) {
      try {
        const { data } = await http.get<DockerSystemVersion>(
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

    async listContainers(environmentId, options = {}) {
      try {
        const { data } = await http.get<DockerContainerDto[]>(
          buildDockerProxyUrl(environmentId, 'containers', 'json'),
          {
            params: {
              all: options.all ?? true,
              filters: options.filters
                ? JSON.stringify(options.filters)
                : undefined,
            },
            headers: options.nodeName
              ? { 'X-PortainerAgent-Target': options.nodeName }
              : undefined,
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve containers');
      }
    },

    async inspectContainer(environmentId, containerId, options = {}) {
      try {
        const { data } = await http.get<DockerContainerDetailsDto>(
          buildDockerProxyUrl(environmentId, 'containers', containerId, 'json'),
          {
            headers: options.nodeName
              ? { 'X-PortainerAgent-Target': options.nodeName }
              : undefined,
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Failed inspecting container');
      }
    },

    async getContainerTop(environmentId, containerId) {
      try {
        const { data } = await http.get<DockerContainerProcessesDto>(
          buildDockerProxyUrl(environmentId, 'containers', containerId, 'top')
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve container top');
      }
    },

    async getContainerStats<T>(
      environmentId: EnvironmentId,
      containerId: string,
      options: { nodeName?: string } = {}
    ) {
      try {
        const { data } = await http.get<T>(
          buildDockerProxyUrl(
            environmentId,
            'containers',
            containerId,
            'stats'
          ),
          {
            params: { stream: false },
            headers: agentTargetHeaders(options.nodeName),
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve container statistics');
      }
    },

    async getContainerLogs(environmentId, containerId, params = {}) {
      try {
        const { data } = await http.get<string>(
          buildDockerProxyUrl(environmentId, 'containers', containerId, 'logs'),
          { params }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to get container logs');
      }
    },

    async createContainer<T>(
      environmentId: EnvironmentId,
      config: unknown,
      options: { nodeName?: string; name?: string } = {}
    ) {
      try {
        const { data } = await http.post<T>(
          buildDockerProxyUrl(environmentId, 'containers', 'create'),
          config,
          {
            params: { name: options.name },
            headers: agentTargetHeaders(options.nodeName),
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to create container');
      }
    },

    async recreateContainer(
      environmentId,
      containerId,
      pullImage,
      options = {}
    ) {
      try {
        await http.post(
          buildDockerProxyUrl(
            environmentId,
            'containers',
            containerId,
            'recreate'
          ),
          { PullImage: pullImage },
          { headers: agentTargetHeaders(options.nodeName) }
        );
      } catch (error) {
        throw normalizeError(error, 'Failed recreating container');
      }
    },

    async updateContainer(environmentId, containerId, config, options = {}) {
      try {
        await http.post(
          buildDockerProxyUrl(
            environmentId,
            'containers',
            containerId,
            'update'
          ),
          config,
          { headers: agentTargetHeaders(options.nodeName) }
        );
      } catch (error) {
        throw normalizeError(error, 'failed updating container');
      }
    },

    async getImage<T>(
      environmentId: EnvironmentId,
      imageId: string,
      options: { nodeName?: string } = {}
    ) {
      try {
        const { data } = await http.get<T>(
          buildDockerProxyUrl(environmentId, 'images', imageId, 'json'),
          { headers: agentTargetHeaders(options.nodeName) }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve image');
      }
    },

    async listImages(environmentId, options = {}) {
      try {
        const { data } = await http.get<DockerImageListDto[]>(
          `/docker/${environmentId}/images`,
          { params: { withUsage: options.withUsage } }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve images');
      }
    },

    async inspectImage<T>(
      environmentId: EnvironmentId,
      imageId: string,
      options: { nodeName?: string } = {}
    ) {
      return this.getImage<T>(environmentId, imageId, options);
    },

    async getImageHistory(environmentId, imageId, options = {}) {
      try {
        const { data } = await http.get<DockerImageHistoryDto[]>(
          buildDockerProxyUrl(environmentId, 'images', imageId, 'history'),
          { headers: agentTargetHeaders(options.nodeName) }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve image layers');
      }
    },

    async removeImage(environmentId, imageId, options = {}) {
      try {
        await http.delete(
          buildDockerProxyUrl(environmentId, 'images', imageId),
          {
            params: { force: options.force },
            headers: agentTargetHeaders(options.nodeName),
          }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to delete image');
      }
    },

    async tagImage(environmentId, imageId, options) {
      try {
        await http.post(
          buildDockerProxyUrl(environmentId, 'images', imageId, 'tag'),
          null,
          {
            params: { repo: options.repo, tag: options.tag },
            headers: agentTargetHeaders(options.nodeName),
          }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to tag image');
      }
    },

    async pullImage(environmentId, options) {
      try {
        const { data } = await http.post<DockerImageBuildLogDto[]>(
          buildDockerProxyUrl(environmentId, 'images', 'create'),
          null,
          {
            params: { fromImage: options.image },
            headers: imageHeaders(options),
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to pull image');
      }
    },

    async pushImage(environmentId, image, options = {}) {
      try {
        const { data } = await http.post<DockerImageBuildLogDto[]>(
          buildDockerProxyUrl(environmentId, 'images', image, 'push'),
          null,
          { headers: imageHeaders(options) }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to push image');
      }
    },

    async pruneImages(environmentId, options = {}) {
      try {
        const { data } = await http.post<DockerImagePruneDto>(
          buildDockerProxyUrl(environmentId, 'images', 'prune'),
          null,
          {
            params: {
              filters: JSON.stringify({
                dangling: [options.all ? 'false' : 'true'],
              }),
            },
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to prune images');
      }
    },

    async pruneBuildCache(environmentId) {
      try {
        const { data } = await http.post<DockerBuildPruneDto>(
          buildDockerProxyUrl(environmentId, 'build', 'prune'),
          null
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to prune build cache');
      }
    },

    async buildImage(environmentId, params, payload, options) {
      try {
        const { data } = await http.post<DockerImageBuildLogDto[]>(
          buildDockerProxyUrl(environmentId, 'build'),
          payload,
          {
            params,
            headers: {
              'Content-Type': options.contentType,
              ...agentTargetHeaders(options.nodeName),
            },
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to build image');
      }
    },

    async uploadImage(environmentId, payload, options = {}) {
      try {
        const { data } = await http.post(
          buildDockerProxyUrl(environmentId, 'images', 'load'),
          payload,
          { headers: agentTargetHeaders(options.nodeName) }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to import image');
      }
    },

    async downloadImages(environmentId, names, options = {}) {
      try {
        return await http.get(
          buildDockerProxyUrl(environmentId, 'images', 'get'),
          {
            params: { names },
            responseType: 'blob',
            headers: agentTargetHeaders(options.nodeName),
          }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to export image');
      }
    },

    async listServices(environmentId, params = {}) {
      return requestList<DockerServiceDto[]>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services'),
        'Unable to retrieve services',
        { params }
      );
    },
    async inspectService(environmentId, serviceId) {
      return requestOne<DockerServiceDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services', serviceId),
        'Unable to retrieve service'
      );
    },
    async createService(environmentId, spec, options = {}) {
      return requestPost<{
        ID: string;
        Portainer?: { ResourceControl?: { Id?: number } };
      }>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services', 'create'),
        spec,
        {
          headers: { version: '1.29', ...registryHeaders(options.registryId) },
        },
        'Unable to create service'
      );
    },
    async updateService(environmentId, serviceId, spec, version, options = {}) {
      return requestPost(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services', serviceId, 'update'),
        spec,
        {
          params: { rollback: options.rollback, version },
          headers: { version: '1.29', ...registryHeaders(options.registryId) },
        },
        'Unable to update service'
      );
    },
    async removeService(environmentId, serviceId) {
      await requestDelete(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services', serviceId),
        'Unable to remove service'
      );
    },
    async getServiceLogs(environmentId, serviceId, params = {}) {
      return requestOne<string>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'services', serviceId, 'logs'),
        'Unable to retrieve service logs',
        { params }
      );
    },
    async listTasks(environmentId, params = {}) {
      return requestList<DockerTaskDto[]>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'tasks'),
        'Unable to retrieve tasks',
        { params }
      );
    },
    async inspectTask(environmentId, taskId) {
      return requestOne<DockerTaskDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'tasks', taskId),
        'Unable to retrieve task'
      );
    },
    async getTaskLogs(environmentId, taskId, params = {}) {
      return requestOne<string>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'tasks', taskId, 'logs'),
        'Unable to retrieve task logs',
        { params }
      );
    },
    async listConfigs(environmentId) {
      return requestList<DockerConfigDto[]>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'configs'),
        'Unable to retrieve configs'
      );
    },
    async inspectConfig(environmentId, configId) {
      return requestOne<DockerConfigDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'configs', configId),
        'Unable to retrieve config'
      );
    },
    async createConfig(environmentId, spec) {
      return requestPost<{
        Id: string;
        Portainer?: { ResourceControl?: { Id?: number } };
      }>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'configs', 'create'),
        spec,
        undefined,
        'Unable to create config'
      );
    },
    async removeConfig(environmentId, configId) {
      await requestDelete(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'configs', configId),
        'Unable to delete config'
      );
    },
    async listSecrets(environmentId) {
      return requestList<DockerSecretDto[]>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'secrets'),
        'Unable to retrieve secrets'
      );
    },
    async inspectSecret(environmentId, secretId) {
      return requestOne<DockerSecretDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'secrets', secretId),
        'Unable to retrieve secret'
      );
    },
    async createSecret(environmentId, spec) {
      return requestPost<{ Id: string }>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'secrets', 'create'),
        spec,
        undefined,
        'Unable to create secret'
      );
    },
    async removeSecret(environmentId, secretId) {
      await requestDelete(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'secrets', secretId),
        'Unable to delete secret'
      );
    },
    async getSwarm(environmentId) {
      return requestOne<DockerSwarmDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'swarm'),
        'Unable to retrieve swarm'
      );
    },
    async listNodes(environmentId) {
      return requestList<DockerNodeDto[]>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'nodes'),
        'Unable to retrieve nodes'
      );
    },
    async inspectNode(environmentId, nodeId) {
      return requestOne<DockerNodeDto>(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'nodes', nodeId),
        'Unable to retrieve node'
      );
    },
    async updateNode(environmentId, nodeId, spec, version) {
      await requestPost(
        http,
        normalizeError,
        buildDockerProxyUrl(environmentId, 'nodes', nodeId, 'update'),
        spec,
        { params: { version } },
        'Unable to update node'
      );
    },

    async resizeExec(environmentId, execId, { width, height }) {
      try {
        await http.post(
          buildDockerProxyUrl(environmentId, 'exec', execId, 'resize'),
          {},
          { params: { h: height, w: width } }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to resize tty of exec');
      }
    },

    async commitContainer<T>(
      environmentId: EnvironmentId,
      params: Record<string, unknown>
    ) {
      try {
        const { data } = await http.post<T>(
          buildDockerProxyUrl(environmentId, 'commit'),
          {},
          { params }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to commit container');
      }
    },

    async startContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'start',
        options
      );
    },

    async stopContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'stop',
        options,
        'Failed stopping container'
      );
    },

    async restartContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'restart',
        options,
        'Failed restarting container'
      );
    },

    async pauseContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'pause',
        options,
        'Failed pausing container'
      );
    },

    async resumeContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'unpause',
        options,
        'Failed resuming container'
      );
    },

    async killContainer(environmentId, containerId, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'kill',
        options,
        'Failed killing container'
      );
    },

    async renameContainer(environmentId, containerId, name, options = {}) {
      return runContainerAction(
        http,
        normalizeError,
        environmentId,
        containerId,
        'rename',
        options,
        'Failed renaming container',
        { name }
      );
    },

    async removeContainer(environmentId, containerId, options = {}) {
      try {
        const { data } = await http.delete<null | { message: string }>(
          buildDockerProxyUrl(environmentId, 'containers', containerId),
          {
            params: { v: options.removeVolumes ? 1 : 0, force: true },
            headers: agentTargetHeaders(options.nodeName),
          }
        );

        if (data?.message) {
          throw new Error(data.message);
        }
      } catch (error) {
        throw normalizeError(error, 'Unable to remove container');
      }
    },

    async listNetworks(environmentId, options = {}) {
      try {
        const { data } = await http.get<DockerNetworkDto[]>(
          buildDockerProxyUrl(environmentId, 'networks'),
          {
            params: {
              filters: options.filters
                ? JSON.stringify(options.filters)
                : undefined,
            },
            headers: agentTargetHeaders(options.nodeName),
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve networks');
      }
    },

    async inspectNetwork(environmentId, networkId, options = {}) {
      try {
        const { data } = await http.get<DockerNetworkDto>(
          buildDockerProxyUrl(environmentId, 'networks', networkId),
          { headers: agentTargetHeaders(options.nodeName) }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to retrieve network details');
      }
    },

    async createNetwork(environmentId, request, options = {}) {
      try {
        const { data } = await http.post<DockerNetworkCreateResponse>(
          buildDockerProxyUrl(environmentId, 'networks', 'create'),
          request,
          {
            headers: {
              ...agentTargetHeaders(options.nodeName),
              ...(options.agentManagerOperation
                ? { 'X-PortainerAgent-ManagerOperation': '1' }
                : {}),
            },
          }
        );
        return data;
      } catch (error) {
        throw normalizeError(error, 'Unable to create network');
      }
    },

    async removeNetwork(environmentId, networkId, options = {}) {
      try {
        await http.delete(
          buildDockerProxyUrl(environmentId, 'networks', networkId),
          { headers: agentTargetHeaders(options.nodeName) }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to remove network');
      }
    },

    async connectContainerToNetwork(environmentId, options) {
      try {
        await http.post(
          buildDockerProxyUrl(
            environmentId,
            'networks',
            options.networkId,
            'connect'
          ),
          {
            Container: options.containerId,
            ...(options.aliases
              ? { EndpointConfig: { Aliases: options.aliases } }
              : {}),
          },
          { headers: agentTargetHeaders(options.nodeName) }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to connect container');
      }
    },

    async disconnectContainerFromNetwork(environmentId, options) {
      try {
        await http.post(
          buildDockerProxyUrl(
            environmentId,
            'networks',
            options.networkId,
            'disconnect'
          ),
          { Container: options.containerId, Force: false },
          { headers: agentTargetHeaders(options.nodeName) }
        );
      } catch (error) {
        throw normalizeError(error, 'Unable to disconnect container');
      }
    },
  };
}

async function runContainerAction(
  http: DockerHttpTransport,
  normalizeError: DockerErrorNormalizer,
  environmentId: EnvironmentId,
  containerId: string,
  action: string,
  options: DockerContainerActionOptions,
  message = 'Failed starting container',
  params?: Record<string, unknown>
) {
  try {
    await http.post<void>(
      buildDockerProxyUrl(environmentId, 'containers', containerId, action),
      {},
      { params, headers: agentTargetHeaders(options.nodeName) }
    );
  } catch (error) {
    throw normalizeError(error, message);
  }
}

function agentTargetHeaders(nodeName?: string) {
  return nodeName ? { 'X-PortainerAgent-Target': nodeName } : undefined;
}

function imageHeaders(options: { nodeName?: string; registryId?: number }) {
  return {
    ...(options.registryId !== undefined
      ? {
          'X-Registry-Auth': btoa(
            JSON.stringify({ registryId: options.registryId })
          ),
        }
      : {}),
    ...agentTargetHeaders(options.nodeName),
  };
}

async function requestOne<T>(
  http: DockerHttpTransport,
  normalizeError: DockerErrorNormalizer,
  url: string,
  message: string,
  options?: { params?: Record<string, unknown> }
): Promise<T> {
  try {
    const { data } = await http.get<T>(url, options);
    return data;
  } catch (error) {
    throw normalizeError(error, message);
  }
}

async function requestList<T>(
  http: DockerHttpTransport,
  normalizeError: DockerErrorNormalizer,
  url: string,
  message: string,
  options?: { params?: Record<string, unknown> }
): Promise<T> {
  return requestOne<T>(http, normalizeError, url, message, options);
}

async function requestPost<T>(
  http: DockerHttpTransport,
  normalizeError: DockerErrorNormalizer,
  url: string,
  body: unknown,
  options:
    | {
        params?: Record<string, unknown>;
        headers?: Record<string, string | undefined>;
      }
    | undefined,
  message: string
): Promise<T> {
  try {
    const { data } = await http.post<T>(url, body, options);
    return data;
  } catch (error) {
    throw normalizeError(error, message);
  }
}

async function requestDelete(
  http: DockerHttpTransport,
  normalizeError: DockerErrorNormalizer,
  url: string,
  message: string
) {
  try {
    await http.delete(url);
  } catch (error) {
    throw normalizeError(error, message);
  }
}

function registryHeaders(registryId?: number) {
  return registryId === undefined
    ? {}
    : { 'X-Registry-Auth': btoa(JSON.stringify({ registryId })) };
}
