import { TeamId } from '@/domains/teams';
import { createRowContext } from '@/ui/components/data-table/RowContext';

interface RowContext {
  disabled?: boolean;
  teamId: TeamId;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
