import { NextResponse } from 'next/server';

const apiOrigin = process.env.PORTAINER_API_ORIGIN || 'http://localhost:9000';

type LoginBody = {
  username?: string;
  password?: string;
};

type AuthResponse = {
  jwt?: string;
};

type DevelopmentEnvironment = {
  Name?: string;
  Type?: number;
  URL?: string;
};

export async function POST(request: Request) {
  const supplied = (await request.json().catch(() => ({}))) as LoginBody;
  const useDevelopmentCredentials =
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTO_LOGIN === 'true' &&
    !supplied.username &&
    !supplied.password;

  const username = useDevelopmentCredentials
    ? process.env.DEV_AUTO_LOGIN_USERNAME
    : supplied.username;
  const password = useDevelopmentCredentials
    ? process.env.DEV_AUTO_LOGIN_PASSWORD
    : supplied.password;

  if (!username || !password) {
    return NextResponse.json(
      { message: 'Username and password are required' },
      { status: 400 }
    );
  }

  if (useDevelopmentCredentials) {
    const initializationError = await ensureDevelopmentAdmin(
      username,
      password
    );
    if (initializationError) {
      return initializationError;
    }
  }

  const response = await fetch(`${apiOrigin}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: username, Password: password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to log in' },
      { status: response.status }
    );
  }

  const auth = (await response.json().catch(() => ({}))) as AuthResponse;

  if (useDevelopmentCredentials) {
    if (!auth.jwt) {
      return NextResponse.json(
        { message: 'Development login did not return a JWT token' },
        { status: 502 }
      );
    }

    if (process.env.DEV_AUTO_CREATE_LOCAL_ENVIRONMENT !== 'false') {
      const environmentError = await ensureDevelopmentLocalEnvironment(
        auth.jwt
      );
      if (environmentError) {
        return environmentError;
      }
    }
  }

  const result = NextResponse.json({ ok: true });
  const authCookie = response.headers.get('set-cookie');
  if (authCookie) {
    result.headers.set('set-cookie', authCookie);
  }
  return result;
}

async function ensureDevelopmentAdmin(username: string, password: string) {
  const checkResponse = await fetch(`${apiOrigin}/api/users/admin/check`, {
    cache: 'no-store',
  });

  if (checkResponse.ok) {
    return null;
  }

  if (checkResponse.status !== 404) {
    return NextResponse.json(
      { message: 'Unable to check the development administrator' },
      { status: checkResponse.status }
    );
  }

  const initResponse = await fetch(`${apiOrigin}/api/users/admin/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: username, Password: password }),
    cache: 'no-store',
  });

  if (!initResponse.ok && initResponse.status !== 409) {
    return NextResponse.json(
      { message: 'Unable to initialize the development administrator' },
      { status: initResponse.status }
    );
  }

  return null;
}

async function ensureDevelopmentLocalEnvironment(jwt: string) {
  const authorization = `Bearer ${jwt}`;
  const listResponse = await fetch(`${apiOrigin}/api/endpoints`, {
    headers: { Authorization: authorization },
    cache: 'no-store',
  });

  if (!listResponse.ok) {
    return NextResponse.json(
      { message: 'Unable to inspect development environments' },
      { status: listResponse.status }
    );
  }

  const environments = (await listResponse.json()) as DevelopmentEnvironment[];
  const socketUrl = 'unix:///var/run/docker.sock';
  if (
    environments.some(
      (environment) => environment.Type === 1 && environment.URL === socketUrl
    )
  ) {
    return null;
  }

  const existingNames = new Set(
    environments.map((environment) => environment.Name).filter(Boolean)
  );
  const name = existingNames.has('local') ? 'local-docker' : 'local';
  const body = new FormData();
  body.set('Name', name);
  body.set('EndpointCreationType', '1');
  body.set('ContainerEngine', 'docker');
  body.set('TagIds', '[]');

  const createResponse = await fetch(`${apiOrigin}/api/endpoints`, {
    method: 'POST',
    headers: { Authorization: authorization },
    body,
    cache: 'no-store',
  });

  if (!createResponse.ok && createResponse.status !== 409) {
    return NextResponse.json(
      { message: 'Unable to connect the local development environment' },
      { status: createResponse.status }
    );
  }

  return null;
}

export async function DELETE(request: Request) {
  const response = await fetch(`${apiOrigin}/api/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
    cache: 'no-store',
  });
  const result = new NextResponse(null, { status: response.status });
  const authCookie = response.headers.get('set-cookie');
  if (authCookie) {
    result.headers.set('set-cookie', authCookie);
  }
  return result;
}
