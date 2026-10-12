import { userQueryKeys } from '@/domains/users';
import { UserId } from '@/domains/users';

export const queryKeys = {
  base: (userId: UserId) => [...userQueryKeys.user(userId), 'tokens'] as const,
};
