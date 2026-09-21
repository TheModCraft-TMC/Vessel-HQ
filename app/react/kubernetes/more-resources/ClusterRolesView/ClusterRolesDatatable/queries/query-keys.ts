import { EnvironmentId } from '@/features/environments';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'cluster_roles'] as const,
};
