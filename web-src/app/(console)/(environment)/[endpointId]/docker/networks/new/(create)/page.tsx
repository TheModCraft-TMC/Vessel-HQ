'use client';

import { CreateNetworkForm } from '@/domains/networks/views/CreateView/CreateView';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="Create network"
        breadcrumbs={[
          { label: 'Networks', link: '/:endpointId/docker/networks' },
          'Add network',
        ]}
      />
      <CreateNetworkForm
        isAdmin={isAdmin}
        userId={user.Id}
        showHeader={false}
      />
    </>
  );
}
