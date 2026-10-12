import { CellContext } from '@tanstack/react-table';
import { Link } from '@console/navigation/Link';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';

import { ServiceRowData } from '../types';

import { columnHelper } from './helper';

export const application = columnHelper.accessor(
  (row) => (row.Applications ? row.Applications[0].Name : ''),
  {
    header: 'Application',
    id: 'application',
    cell: Cell,
  }
);

function Cell({ row, getValue }: CellContext<ServiceRowData, string>) {
  const appName = getValue();
  const environmentId = useEnvironmentId();

  return appName ? (
    <Link
      to="/:endpointId/kubernetes/applications/:namespace/:name"
      params={{
        endpointId: environmentId,
        namespace: row.original.Namespace,
        name: appName,
      }}
      title={appName}
      data-cy={`service-application-link-${appName}`}
    >
      {appName}
    </Link>
  ) : (
    '-'
  );
}
