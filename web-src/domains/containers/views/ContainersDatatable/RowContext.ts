import { Environment } from '@/domains/environments';
import { createRowContext } from '@/ui/components/data-table/RowContext';

interface RowContextState {
  environment: Environment;
}

const { RowProvider, useRowContext } = createRowContext<RowContextState>();

export { RowProvider, useRowContext };
