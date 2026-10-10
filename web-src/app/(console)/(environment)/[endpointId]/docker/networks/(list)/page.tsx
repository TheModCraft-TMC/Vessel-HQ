'use client';

import { NetworksDatatable } from '@/domains/networks/components/NetworkList/NetworksDatatable';
import { useDeleteNetworkListMutation } from '@/domains/networks/queries/useDeleteNetworkListMutation';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const removeNetworks = useDeleteNetworkListMutation();

  return (
    <>
      <PageHeader title="Network list" breadcrumbs="Networks" reload />
      <NetworksDatatable
        onRemove={(networks) => removeNetworks.mutate({ networks })}
      />
    </>
  );
}
