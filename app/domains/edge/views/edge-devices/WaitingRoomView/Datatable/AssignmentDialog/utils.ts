import { Environment } from '@/domains/environments';

export function isAssignedToGroup(environment: Environment) {
  return ![0, 1].includes(environment.GroupId);
}
