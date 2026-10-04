'use client';

import { CreateServiceForm } from '@/domains/services/CreateView/CreateView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';

export function DockerServiceCreateContent() {
  const environmentId = useEnvironmentId();
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  if (isLoading) return null;

  return (
    <CreateServiceForm
      environmentId={environmentId}
      isAdmin={isAdmin}
      userId={user.Id}
      showHeader={false}
    />
  );
}
