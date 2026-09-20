import { useAccesses } from '@/react/portainer/access-control/AccessManagement/useAccesses';

import { EnvironmentGroup } from '../types';

/** Splits the users and teams between those already authorized on the group and those still available to be added. */
export function useGroupAccesses(group?: EnvironmentGroup) {
  return useAccesses(group);
}
