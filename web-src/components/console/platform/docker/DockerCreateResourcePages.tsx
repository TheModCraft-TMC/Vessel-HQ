'use client';

import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { ConfigViewModel } from '@/domains/services/configs/model';
import { queryKeys } from '@/domains/services/configs/queries/query-keys';
import { getConfig } from '@/domains/services/configs/queries/useConfig';
import { CreateConfigForm } from '@/domains/services/configs/CreateView/CreateView';
import { CreateSecretForm } from '@/domains/services/secrets/CreateView/CreateView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';

import { useRouteParams } from '../../routing/useRouteParams';

export function DockerConfigCreateContent() {
  const environmentId = useEnvironmentId();
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  const params = useRouteParams();
  const cloneQuery = useQuery(
    [...queryKeys.base(environmentId), params.id],
    async () => new ConfigViewModel(await getConfig(environmentId, params.id)),
    { enabled: Boolean(params.id), ...withError('Unable to clone config') }
  );

  if (isLoading || (params.id && cloneQuery.isLoading)) return null;

  return (
    <CreateConfigForm
      environmentId={environmentId}
      isAdmin={isAdmin}
      userId={user.Id}
      source={cloneQuery.data}
      showHeader={false}
    />
  );
}

export function DockerSecretCreateContent() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  if (isLoading) return null;

  return (
    <CreateSecretForm isAdmin={isAdmin} userId={user.Id} showHeader={false} />
  );
}
