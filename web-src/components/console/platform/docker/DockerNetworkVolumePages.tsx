'use client';

import { CreateNetworkForm } from '@/domains/networks/views/CreateView/CreateView';
import { CreateVolumeForm } from '@/domains/volumes/views/CreateView';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';

export function DockerNetworkCreateContent() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  if (isLoading) return null;

  return (
    <CreateNetworkForm isAdmin={isAdmin} userId={user.Id} showHeader={false} />
  );
}

export function DockerVolumeCreateContent() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  if (isLoading) return null;

  return (
    <CreateVolumeForm isAdmin={isAdmin} userId={user.Id} showHeader={false} />
  );
}
