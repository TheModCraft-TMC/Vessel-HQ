import { EnvironmentId } from '@/features/environments';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'role_bindings'] as const,
};
