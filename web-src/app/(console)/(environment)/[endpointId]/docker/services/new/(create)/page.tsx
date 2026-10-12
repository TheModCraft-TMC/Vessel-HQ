'use client';

import { CreateServiceForm } from '@/domains/services/CreateView/CreateView';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/core/session/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="Create service"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          'Add service',
        ]}
      />
      <CreateServiceForm
        environmentId={environmentId}
        isAdmin={isAdmin}
        userId={user.Id}
        showHeader={false}
      />
    </>
  );
}
