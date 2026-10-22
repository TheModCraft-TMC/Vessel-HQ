import KubernetesCommonHelper from './commonHelper';

it.each([
  ['...__--name-._', 'name'],
  ['__My Owner/name!!', 'My.Owner.name'],
  ['-._'.repeat(30), ''],
  ['a.b_c-d', 'a.b_c-d'],
  ['x'.repeat(62) + '--tail', 'x'.repeat(62)],
  ['', ''],
])('normalizes owner %s into label %s', (owner, expected) => {
  expect(KubernetesCommonHelper.ownerToLabel(owner)).toBe(expected);
});
