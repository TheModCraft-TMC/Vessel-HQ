import { getContainerTransitionType } from './containerTransition';

describe('getContainerTransitionType', () => {
  it('moves forward from the list through details to a container tool', () => {
    expect(
      getContainerTransitionType(
        '/1/docker/containers',
        '/1/docker/containers/abc'
      )
    ).toBe('container-forward');
    expect(
      getContainerTransitionType(
        '/1/docker/containers/abc',
        '/1/docker/containers/abc/logs'
      )
    ).toBe('container-forward');
  });

  it('reverses when navigating toward container details or the list', () => {
    expect(
      getContainerTransitionType(
        '/1/docker/containers/abc/logs',
        '/1/docker/containers/abc'
      )
    ).toBe('container-back');
    expect(
      getContainerTransitionType(
        '/1/docker/containers/abc',
        '/1/docker/containers'
      )
    ).toBe('container-back');
  });

  it('uses the default transition for sibling tools and other routes', () => {
    expect(
      getContainerTransitionType(
        '/1/docker/containers/abc/logs',
        '/1/docker/containers/abc/stats'
      )
    ).toBeUndefined();
    expect(
      getContainerTransitionType('/environments', '/settings')
    ).toBeUndefined();
  });
});
