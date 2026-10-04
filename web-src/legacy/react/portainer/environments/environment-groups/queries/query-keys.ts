import { EnvironmentGroupId } from '@/domains/environments';

export const queryKeys = {
  base: () => ['environment-groups'] as const,
  list: (size = false) => [...queryKeys.base(), { size }] as const,
  group: (id?: EnvironmentGroupId, size = false) =>
    [...queryKeys.base(), id, { size }] as const,
};
