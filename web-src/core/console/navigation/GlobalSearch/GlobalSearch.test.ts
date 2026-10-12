import { buildSearchItems } from './GlobalSearch';

test('includes environment routes when searching from an environment', () => {
  const items = buildSearchItems('/12/docker/containers');

  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Containers',
        href: '/12/docker/containers',
      }),
      expect.objectContaining({ title: 'Settings', href: '/settings' }),
    ])
  );
});

test('only includes global routes outside an environment', () => {
  const items = buildSearchItems('/settings');

  expect(items.some((item) => item.href.includes('/docker/'))).toBe(false);
  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: 'Environments', href: '/environments' }),
    ])
  );
});
