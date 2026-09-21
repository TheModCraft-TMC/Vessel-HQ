import { EnvironmentId } from '@/domains/environments';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'roles'] as const,
};
