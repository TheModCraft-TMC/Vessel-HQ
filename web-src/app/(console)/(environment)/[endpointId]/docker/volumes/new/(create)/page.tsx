'use client';

import { CreateVolumeForm } from '@/domains/volumes/views/CreateView';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="Create volume"
        breadcrumbs={[
          { label: 'Volumes', link: '/:endpointId/docker/volumes' },
          'Add volume',
        ]}
      />
      <CreateVolumeForm isAdmin={isAdmin} userId={user.Id} showHeader={false} />
    </>
  );
}
