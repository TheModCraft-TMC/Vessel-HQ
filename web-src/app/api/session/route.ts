import { NextResponse } from 'next/server';

const apiOrigin = process.env.PORTAINER_API_ORIGIN || 'http://localhost:9000';

type LoginBody = {
  username?: string;
  password?: string;
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

  const result = NextResponse.json({ ok: true });
  const authCookie = response.headers.get('set-cookie');
  if (authCookie) {
    result.headers.set('set-cookie', authCookie);
  }
  return result;
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
