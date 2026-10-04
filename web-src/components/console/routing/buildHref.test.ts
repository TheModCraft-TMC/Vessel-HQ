import { describe, expect, it } from 'vitest';

import { buildHref } from './buildHref';

describe('buildHref', () => {
  it('resolves global list routes', () => {
    expect(buildHref('/users')).toBe('/users');
  });

  it('interpolates dynamic route parameters', () => {
    expect(buildHref('/sources/:sourceId', { sourceId: 42 })).toBe(
      '/sources/42'
    );
  });

  it('preserves unused parameters as search parameters', () => {
    expect(buildHref('/groups/:id', { id: 7, tab: 'access' })).toBe(
      '/groups/7?tab=access'
    );
  });

  it('renders the hash parameter as a URL fragment', () => {
    expect(buildHref('/settings', { '#': 'kubernetes-settings' })).toBe(
      '/settings#kubernetes-settings'
    );
  });

  it('resolves relative list item states from the current pathname', () => {
    expect(buildHref('./:id', { id: 3 }, '/users')).toBe('/users/3');
  });

  it('resolves a parent route', () => {
    expect(buildHref('..', {}, '/sources/9')).toBe('/sources');
  });

  it('inherits the environment id for platform routes', () => {
    expect(
      buildHref(
        '/:endpointId/docker/containers/:id/logs',
        { id: 'web' },
        '/12/docker/containers'
      )
    ).toBe('/12/docker/containers/web/logs');
  });
});
