'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { withError } from '@/core/query';
import { CreateConfigForm } from '@/domains/services/configs/CreateView/CreateView';
import { ConfigViewModel } from '@/domains/services/configs/model';
import { queryKeys } from '@/domains/services/configs/queries/query-keys';
import { getConfig } from '@/domains/services/configs/queries/useConfig';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
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
    <>
      <PageHeader
        title="Create config"
        breadcrumbs={[
          { label: 'Configs', link: '/:endpointId/docker/configs' },
          'Add config',
        ]}
      />
      <CreateConfigForm
        environmentId={environmentId}
        isAdmin={isAdmin}
        userId={user.Id}
        source={cloneQuery.data}
        showHeader={false}
      />
    </>
  );
}
