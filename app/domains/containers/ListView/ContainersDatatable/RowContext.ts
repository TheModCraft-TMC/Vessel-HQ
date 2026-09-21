import { Environment } from '@/domains/environments';

import { createRowContext } from '@@/datatables/RowContext';

interface RowContextState {
  environment: Environment;
}

const { RowProvider, useRowContext } = createRowContext<RowContextState>();

export { RowProvider, useRowContext };
