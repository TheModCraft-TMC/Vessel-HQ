import { Environment } from '@/features/environments';

export function isAssignedToGroup(environment: Environment) {
  return ![0, 1].includes(environment.GroupId);
}
