import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

describe('development auto login', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DEV_AUTO_LOGIN', 'true');
    vi.stubEnv('DEV_AUTO_LOGIN_USERNAME', 'dev-admin');
    vi.stubEnv('DEV_AUTO_LOGIN_PASSWORD', 'development-password');
    vi.stubEnv('DEV_AUTO_CREATE_LOCAL_ENVIRONMENT', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('creates a Docker socket environment when one is missing', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json(
          { jwt: 'development-jwt' },
          {
            headers: {
              'set-cookie': 'portainer_api_key=development-jwt; Path=/',
            },
          }
        )
      )
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({ Id: 1 }, { status: 200 }));

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const createRequest = fetchMock.mock.calls[3];
    const options = createRequest[1];
    expect(createRequest[0]).toBe('http://localhost:9000/api/endpoints');
    expect(options?.headers).toEqual({
      Authorization: 'Bearer development-jwt',
    });
    expect(options?.body).toBeInstanceOf(FormData);
    const body = options?.body as FormData;
    expect(body.get('Name')).toBe('local');
    expect(body.get('EndpointCreationType')).toBe('1');
    expect(body.get('ContainerEngine')).toBe('docker');
  });

  it('reuses an existing Docker socket environment', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json(
          { jwt: 'development-jwt' },
          {
            headers: {
              'set-cookie': 'portainer_api_key=development-jwt; Path=/',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        Response.json([
          {
            Name: 'local',
            Type: 1,
            URL: 'unix:///var/run/docker.sock',
          },
        ])
      );

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('supports auto-login without provisioning Docker for a separately managed backend', async () => {
    vi.stubEnv('DEV_AUTO_CREATE_LOCAL_ENVIRONMENT', 'false');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json(
          { jwt: 'development-jwt' },
          {
            headers: {
              'set-cookie': 'portainer_api_key=development-jwt; Path=/',
            },
          }
        )
      );

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('portainer_api_key=');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:9000/api/auth');
  });

  it('never accepts development credentials in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DEV_AUTO_CREATE_LOCAL_ENVIRONMENT', 'false');
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(loginRequest());

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function loginRequest() {
  return new Request('http://localhost:8999/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
