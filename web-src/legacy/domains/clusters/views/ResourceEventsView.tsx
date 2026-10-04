import { useKubeStore } from '@/domains/clusters/datatables/default-kube-datatable-store';
import { useEvents } from '@/domains/clusters/queries/useEvents';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { EventsDatatable } from '../components/EventsDatatable';

type Props = {
  storageKey: string;
  /** if undefined, all resources for the namespace (or cluster are returned) */
  resourceId?: string;
  /** if undefined, events are fetched for the cluster */
  namespace?: string;
  noWidget?: boolean;
  isLoading?: boolean;
};

/** Query-owning wrapper for the presentational resource events table. */
export function ResourceEventsView({
  storageKey,
  resourceId,
  namespace,
  noWidget = true,
  isLoading = false,
}: Props) {
  const tableState = useKubeStore(storageKey, {
    id: 'Date',
    desc: true,
  });

  const endpointId = useEnvironmentId();

  const resourceEventsQuery = useEvents(endpointId, {
    namespace,
    params: resourceId ? { resourceId: `${resourceId}` } : {},
    queryOptions: {
      autoRefreshRate: tableState.autoRefreshRateMS
        ? tableState.autoRefreshRateMS
        : undefined,
    },
  });

  return (
    <EventsDatatable
      dataset={resourceEventsQuery.data ?? []}
      tableState={tableState}
      isLoading={resourceEventsQuery.isLoading || isLoading}
      data-cy="k8sNodeDetail-eventsTable"
      noWidget={noWidget}
    />
  );
}
