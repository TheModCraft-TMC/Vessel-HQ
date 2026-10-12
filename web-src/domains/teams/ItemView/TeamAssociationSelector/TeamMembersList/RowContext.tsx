import { TeamRole, TeamId } from '@/domains/teams';
import { UserId } from '@/domains/users';
import { createRowContext } from '@/ui/components/data-table/RowContext';

export interface RowContext {
  getRole(userId: UserId): TeamRole;
  membershipChangesDisabled?: boolean;
  roleChangesDisabled?: boolean;
  teamId: TeamId;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
