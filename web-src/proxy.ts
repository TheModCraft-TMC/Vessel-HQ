import { type NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'portainer_api_key';

export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === '/login';
  const authenticated = request.cookies.has(AUTH_COOKIE);

  if (!authenticated && !isLogin) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'returnTo',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|images|_next/static|_next/image|favicon.ico).*)'],
};
