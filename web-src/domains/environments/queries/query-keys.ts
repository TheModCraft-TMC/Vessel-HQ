import type { EnvironmentGroupId, EnvironmentId } from '../types';

export const environmentQueryKeys = {
  base: () => ['environments'] as const,
  item: (id: EnvironmentId) => [...environmentQueryKeys.base(), id] as const,
  group: (id?: EnvironmentGroupId, size = false) =>
    ['environment-groups', id, { size }] as const,
  registries: (environmentId: EnvironmentId, namespace?: string) =>
    [
      ...environmentQueryKeys.item(environmentId),
      'registries',
      namespace,
    ] as const,
};
