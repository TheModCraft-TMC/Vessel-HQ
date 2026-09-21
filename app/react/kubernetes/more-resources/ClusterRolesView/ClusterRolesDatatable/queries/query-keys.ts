import { EnvironmentId } from '@/domains/environments';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'cluster_roles'] as const,
};
