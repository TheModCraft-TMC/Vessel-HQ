import {
  buildHeaderBreadcrumbs,
  getContainerIdFromPathname,
} from './headerBreadcrumbs';

describe('buildHeaderBreadcrumbs', () => {
  it('returns the complete container tool path', () => {
    expect(
      buildHeaderBreadcrumbs('/5/docker/containers/8ddacac21/logs', 'Prod', {
        '8ddacac21': 'web-api',
      })
    ).toEqual([
      { label: 'Environments', href: '/environments' },
      { label: 'Prod', href: '/environments/5' },
      { label: 'Docker', href: '/5/docker' },
      { label: 'Containers', href: '/5/docker/containers' },
      { label: 'web-api', href: '/5/docker/containers/8ddacac21' },
      { label: 'Logs' },
    ]);
  });

  it('extracts a container id only from container detail routes', () => {
    expect(
      getContainerIdFromPathname('/5/docker/containers/8ddacac21/logs')
    ).toBe('8ddacac21');
    expect(getContainerIdFromPathname('/5/docker/containers')).toBeUndefined();
    expect(getContainerIdFromPathname('/environments/5')).toBeUndefined();
  });

  it('returns every administration path segment', () => {
    expect(buildHeaderBreadcrumbs('/settings/edge-compute')).toEqual([
      { label: 'Settings', href: '/settings' },
      { label: 'Edge compute' },
    ]);
  });

  it('uses the environments label at the console root', () => {
    expect(buildHeaderBreadcrumbs('/')).toEqual([{ label: 'Environments' }]);
  });
});
