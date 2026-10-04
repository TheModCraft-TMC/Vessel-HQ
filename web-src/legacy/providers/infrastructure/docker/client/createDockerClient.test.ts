import { SystemInfo, SystemVersion } from 'docker-types';
import { describe, expect, it, vi } from 'vitest';

import { createDockerClient, DockerHttpTransport } from '../index';

describe('createDockerClient', () => {
  it('retrieves Docker system info', async () => {
    const info = { OSType: 'linux', NCPU: 8 } as SystemInfo;
    const http = createHttpTransport({ data: info });
    const client = createDockerClient({
      http,
      normalizeError: vi.fn(),
    });

    await expect(client.getInfo(7)).resolves.toBe(info);
    expect(http.get).toHaveBeenCalledWith('/endpoints/7/docker/info');
  });

  it('retrieves the Docker Engine version', async () => {
    const version = { ApiVersion: '1.47', Version: '27.0.0' } as SystemVersion;
    const http = createHttpTransport({ data: version });
    const client = createDockerClient({
      http,
      normalizeError: vi.fn(),
    });

    await expect(client.getVersion(7)).resolves.toBe(version);
    expect(http.get).toHaveBeenCalledWith('/endpoints/7/docker/version');
  });

  it('normalizes system info errors with a useful fallback message', async () => {
    const requestError = new Error('request failed');
    const normalizedError = new Error('normalized');
    const http = createHttpTransport();
    const normalizeError = vi.fn(() => normalizedError);
    vi.mocked(http.get).mockRejectedValue(requestError);
    const client = createDockerClient({ http, normalizeError });

    await expect(client.getInfo(7)).rejects.toBe(normalizedError);
    expect(normalizeError).toHaveBeenCalledWith(
      requestError,
      'Unable to retrieve system info'
    );
  });

  it('pings the Docker Engine', async () => {
    const http = createHttpTransport({ data: 'OK' });
    const client = createDockerClient({
      http,
      normalizeError: vi.fn(),
    });

    await expect(client.ping(7)).resolves.toBeUndefined();
    expect(http.get).toHaveBeenCalledWith('/endpoints/7/docker/_ping');
  });

  it('lists containers with Docker filters and agent targeting', async () => {
    const http = createHttpTransport({ data: [] });
    const client = createDockerClient({ http, normalizeError: vi.fn() });
    const filters = { status: ['running'] };

    await expect(
      client.listContainers(7, { all: true, filters, nodeName: 'worker-1' })
    ).resolves.toEqual([]);

    expect(http.get).toHaveBeenCalledWith(
      '/endpoints/7/docker/containers/json',
      {
        params: { all: true, filters: JSON.stringify(filters) },
        headers: { 'X-PortainerAgent-Target': 'worker-1' },
      }
    );
  });

  it('normalizes container list errors', async () => {
    const requestError = new Error('request failed');
    const normalizedError = new Error('normalized');
    const http = createHttpTransport();
    const normalizeError = vi.fn(() => normalizedError);
    vi.mocked(http.get).mockRejectedValue(requestError);
    const client = createDockerClient({ http, normalizeError });

    await expect(client.listContainers(7)).rejects.toBe(normalizedError);
    expect(normalizeError).toHaveBeenCalledWith(
      requestError,
      'Unable to retrieve containers'
    );
  });

  it('inspects a container and targets a Docker agent when requested', async () => {
    const details = { Id: 'container-1', Name: '/web' };
    const http = createHttpTransport({ data: details });
    const client = createDockerClient({ http, normalizeError: vi.fn() });

    await expect(
      client.inspectContainer(7, 'container-1', { nodeName: 'worker-1' })
    ).resolves.toBe(details);

    expect(http.get).toHaveBeenCalledWith(
      '/endpoints/7/docker/containers/container-1/json',
      { headers: { 'X-PortainerAgent-Target': 'worker-1' } }
    );
  });

  it('retrieves container processes', async () => {
    const processes = {
      Processes: [['1', 'nginx']],
      Titles: ['PID', 'COMMAND'],
    };
    const http = createHttpTransport({ data: processes });
    const client = createDockerClient({ http, normalizeError: vi.fn() });

    await expect(client.getContainerTop(7, 'container-1')).resolves.toBe(
      processes
    );

    expect(http.get).toHaveBeenCalledWith(
      '/endpoints/7/docker/containers/container-1/top'
    );
  });

  it('runs lifecycle actions with agent targeting', async () => {
    const http = createHttpTransport({ data: null });
    const client = createDockerClient({ http, normalizeError: vi.fn() });

    await client.startContainer(7, 'container-1', { nodeName: 'worker-1' });
    await client.stopContainer(7, 'container-1');
    await client.restartContainer(7, 'container-1');
    await client.pauseContainer(7, 'container-1');
    await client.resumeContainer(7, 'container-1');
    await client.killContainer(7, 'container-1');
    await client.renameContainer(7, 'container-1', 'renamed');

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/endpoints/7/docker/containers/container-1/start',
      {},
      { params: undefined, headers: { 'X-PortainerAgent-Target': 'worker-1' } }
    );
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      '/endpoints/7/docker/containers/container-1/stop',
      {},
      { params: undefined, headers: undefined }
    );
    expect(http.post).toHaveBeenNthCalledWith(
      7,
      '/endpoints/7/docker/containers/container-1/rename',
      {},
      { params: { name: 'renamed' }, headers: undefined }
    );
  });

  it('removes a container with force and volume options', async () => {
    const http = createHttpTransport({ data: null });
    const client = createDockerClient({ http, normalizeError: vi.fn() });

    await client.removeContainer(7, 'container-1', {
      nodeName: 'worker-1',
      removeVolumes: true,
    });

    expect(http.delete).toHaveBeenCalledWith(
      '/endpoints/7/docker/containers/container-1',
      {
        params: { v: 1, force: true },
        headers: { 'X-PortainerAgent-Target': 'worker-1' },
      }
    );
  });

  it('handles Docker network transport operations', async () => {
    const http = createHttpTransport({
      data: { Id: 'network-1', Warning: '' },
    });
    const client = createDockerClient({ http, normalizeError: vi.fn() });
    const filters = { driver: ['bridge'] };

    await client.listNetworks(7, { filters, nodeName: 'worker-1' });
    await client.inspectNetwork(7, 'network-1', { nodeName: 'worker-1' });
    await client.createNetwork(
      7,
      { Name: 'private', Driver: 'bridge' },
      { nodeName: 'worker-1', agentManagerOperation: true }
    );
    await client.removeNetwork(7, 'network-1', { nodeName: 'worker-1' });
    await client.connectContainerToNetwork(7, {
      networkId: 'network-1',
      containerId: 'container-1',
      aliases: ['web'],
      nodeName: 'worker-1',
    });
    await client.disconnectContainerFromNetwork(7, {
      networkId: 'network-1',
      containerId: 'container-1',
      nodeName: 'worker-1',
    });

    expect(http.get).toHaveBeenNthCalledWith(
      1,
      '/endpoints/7/docker/networks',
      {
        params: { filters: JSON.stringify(filters) },
        headers: { 'X-PortainerAgent-Target': 'worker-1' },
      }
    );
    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/endpoints/7/docker/networks/create',
      { Name: 'private', Driver: 'bridge' },
      {
        headers: {
          'X-PortainerAgent-Target': 'worker-1',
          'X-PortainerAgent-ManagerOperation': '1',
        },
      }
    );
  });

  it('normalizes version errors with a useful fallback message', async () => {
    const requestError = new Error('request failed');
    const normalizedError = new Error('normalized');
    const http = createHttpTransport();
    const normalizeError = vi.fn(() => normalizedError);
    vi.mocked(http.get).mockRejectedValue(requestError);
    const client = createDockerClient({ http, normalizeError });

    await expect(client.getVersion(7)).rejects.toBe(normalizedError);
    expect(normalizeError).toHaveBeenCalledWith(
      requestError,
      'Unable to retrieve version'
    );
  });

  it('normalizes ping errors without adding a fallback message', async () => {
    const requestError = new Error('request failed');
    const normalizedError = new Error('normalized');
    const http = createHttpTransport();
    const normalizeError = vi.fn(() => normalizedError);
    vi.mocked(http.get).mockRejectedValue(requestError);
    const client = createDockerClient({ http, normalizeError });

    await expect(client.ping(7)).rejects.toBe(normalizedError);
    expect(normalizeError).toHaveBeenCalledWith(requestError);
  });
});

function createHttpTransport(
  response: { data: unknown } = { data: undefined }
) {
  return {
    get: vi.fn().mockResolvedValue(response),
    post: vi.fn().mockResolvedValue(response),
    delete: vi.fn().mockResolvedValue(response),
  } as DockerHttpTransport;
}
