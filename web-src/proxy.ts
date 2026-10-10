import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const AUTH_COOKIE = 'portainer_api_key';
export const HTML_CACHE_CONTROL =
  'private, no-cache, no-store, max-age=0, must-revalidate, no-transform';
const OAUTH_CALLBACK_PARAMETERS = [
  'code',
  'state',
  'error',
  'error_description',
] as const;

export function buildContentSecurityPolicy(nonce: string) {
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.hsforms.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://static.cloudflareinsights.com`,
    `connect-src 'self' https://cloudflareinsights.com`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `frame-src https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
  ].join('; ');
}

export function buildLoginRedirectUrl(requestUrl: string) {
  const currentUrl = new URL(requestUrl);
  const loginUrl = new URL('/login', currentUrl);
  const isOAuthCallback = ['code', 'state', 'error'].some((parameter) =>
    currentUrl.searchParams.has(parameter)
  );

  if (isOAuthCallback) {
    for (const parameter of OAUTH_CALLBACK_PARAMETERS) {
      const value = currentUrl.searchParams.get(parameter);
      if (value !== null) {
        loginUrl.searchParams.set(parameter, value);
      }
    }

    return loginUrl;
  }

  loginUrl.searchParams.set(
    'returnTo',
    `${currentUrl.pathname}${currentUrl.search}`
  );
  return loginUrl;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(uuidv4()).toString('base64');
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const isLogin = request.nextUrl.pathname === '/login';
  const authenticated = request.cookies.has(AUTH_COOKIE);

  if (!authenticated && !isLogin) {
    const loginUrl = buildLoginRedirectUrl(request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('Cache-Control', HTML_CACHE_CONTROL);
    return response;
  }

  if (authenticated && isLogin) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('Cache-Control', HTML_CACHE_CONTROL);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('Cache-Control', HTML_CACHE_CONTROL);

  return response;
}

export const config = {
  matcher: ['/((?!api|images|_next/static|_next/image|favicon.ico).*)'],
};
