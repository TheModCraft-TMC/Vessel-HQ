'use client';

import { CreateSecretForm } from '@/domains/services/secrets/CreateView/CreateView';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="Create secret"
        breadcrumbs={[
          { label: 'Secrets', link: '/:endpointId/docker/secrets' },
          'Add secret',
        ]}
      />
      <CreateSecretForm isAdmin={isAdmin} userId={user.Id} showHeader={false} />
    </>
  );
}
