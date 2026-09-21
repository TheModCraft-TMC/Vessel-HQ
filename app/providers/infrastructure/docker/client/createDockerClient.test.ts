import { SystemVersion } from 'docker-types';
import { describe, expect, it, vi } from 'vitest';

import { createDockerClient, DockerHttpTransport } from '../index';

describe('createDockerClient', () => {
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

  it('pings the Docker Engine', async () => {
    const http = createHttpTransport({ data: 'OK' });
    const client = createDockerClient({
      http,
      normalizeError: vi.fn(),
    });

    await expect(client.ping(7)).resolves.toBeUndefined();
    expect(http.get).toHaveBeenCalledWith('/endpoints/7/docker/_ping');
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
  } as DockerHttpTransport;
}
