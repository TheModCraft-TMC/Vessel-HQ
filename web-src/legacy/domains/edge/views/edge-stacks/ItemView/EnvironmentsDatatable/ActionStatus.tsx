import { useRouteParams } from '@console/console/routing/useRouteParams';

import { EnvironmentId } from '@/domains/environments';

import { useLogsStatus } from './useLogsStatus';

interface Props {
  environmentId: EnvironmentId;
}

export function ActionStatus({ environmentId }: Props) {
  const { stackId } = useRouteParams();
  const edgeStackId = Number(stackId);

  const logsStatusQuery = useLogsStatus(edgeStackId, environmentId);

  return <>{getStatusText(logsStatusQuery.data)}</>;
}

function getStatusText(status?: 'pending' | 'collected' | 'idle') {
  switch (status) {
    case 'collected':
      return 'Logs available for download';
    case 'pending':
      return 'Logs marked for collection, please wait until the logs are available';
    default:
      return null;
  }
}
