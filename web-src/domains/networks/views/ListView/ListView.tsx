import { PageContent } from '@console/layout/PageContent';

import { PageHeader } from '@/ui/layouts/view-layout';
import { useDeleteNetworkListMutation } from '@/domains/networks/queries/useDeleteNetworkListMutation';
import { NetworksDatatable } from '@/domains/networks/components/NetworkList/NetworksDatatable';

export function ListView() {
  const removeMutation = useDeleteNetworkListMutation();

  return (
    <>
      <PageHeader title="Network List" breadcrumbs={['Networks']} reload />

      <PageContent>
        <NetworksDatatable
          onRemove={(networks) => removeMutation.mutate({ networks })}
        />
      </PageContent>
    </>
  );
}
