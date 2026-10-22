import { renderHook } from '@testing-library/react';

import { useSidebarSrefActive } from './useSidebarSrefActive';

vi.mock('next/navigation', () => ({
  usePathname: () => '/1/docker/dashboard',
}));

it.each([undefined, {}])(
  'accepts omitted or empty path options: %s',
  (options) => {
    const { result } = renderHook(() =>
      useSidebarSrefActive('/1/docker', undefined, undefined, options)
    );
    expect(result.current.className).toBe('bg-graphite-500');
  }
);

it('honors explicit ignore paths', () => {
  const { result } = renderHook(() =>
    useSidebarSrefActive(
      '/1/docker',
      undefined,
      {},
      { ignorePaths: ['/1/docker/dashboard'] }
    )
  );
  expect(result.current.className).toBe('');
});

it('honors explicit include paths', () => {
  const { result } = renderHook(() =>
    useSidebarSrefActive(
      '/1/other',
      undefined,
      {},
      { includePaths: ['/1/docker/dashboard'] }
    )
  );
  expect(result.current.className).toBe('bg-graphite-500');
});
