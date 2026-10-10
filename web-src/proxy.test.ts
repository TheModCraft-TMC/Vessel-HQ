import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import {
  buildContentSecurityPolicy,
  buildLoginRedirectUrl,
  HTML_CACHE_CONTROL,
  proxy,
} from './proxy';

describe('HTML_CACHE_CONTROL', () => {
  it('prevents intermediaries from rewriting streamed Next.js HTML', () => {
    expect(HTML_CACHE_CONTROL).toContain('no-store');
    expect(HTML_CACHE_CONTROL).toContain('no-transform');
  });
});

describe('proxy authentication routing', () => {
  it('allows the login page to validate and recover a stale auth cookie', () => {
    const request = new NextRequest('https://vessel.example/login', {
      headers: { cookie: 'portainer_api_key=expired-token' },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('buildContentSecurityPolicy', () => {
  it('allows only scripts carrying the per-request nonce', () => {
    const policy = buildContentSecurityPolicy('test-nonce');

    expect(policy).toContain(
      "script-src 'self' 'nonce-test-nonce' 'strict-dynamic'"
    );
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  });
});

describe('buildLoginRedirectUrl', () => {
  it('preserves OAuth callback parameters at the login route', () => {
    const redirect = buildLoginRedirectUrl(
      'https://vessel.example/?code=authorization-code&state=expected-state'
    );

    expect(redirect.pathname).toBe('/login');
    expect(redirect.searchParams.get('code')).toBe('authorization-code');
    expect(redirect.searchParams.get('state')).toBe('expected-state');
    expect(redirect.searchParams.has('returnTo')).toBe(false);
  });

  it('preserves OAuth provider errors at the login route', () => {
    const redirect = buildLoginRedirectUrl(
      'https://vessel.example/?error=access_denied&error_description=Login%20cancelled&state=expected-state'
    );

    expect(redirect.pathname).toBe('/login');
    expect(redirect.searchParams.get('error')).toBe('access_denied');
    expect(redirect.searchParams.get('error_description')).toBe(
      'Login cancelled'
    );
    expect(redirect.searchParams.get('state')).toBe('expected-state');
  });

  it('keeps the original destination for ordinary unauthenticated visits', () => {
    const redirect = buildLoginRedirectUrl(
      'https://vessel.example/environments/4?tab=stacks'
    );

    expect(redirect.pathname).toBe('/login');
    expect(redirect.searchParams.get('returnTo')).toBe(
      '/environments/4?tab=stacks'
    );
  });
});
