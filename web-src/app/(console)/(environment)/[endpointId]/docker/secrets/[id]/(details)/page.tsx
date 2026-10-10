'use client';

import { useCallback, useMemo } from 'react';
import { Lock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { withError } from '@/core/query';
import { SecretViewModel } from '@/domains/services/models/secret';
import {
  getSecret,
  removeSecret,
} from '@/domains/services/secrets/queries/useSecrets';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { DockerObjectDetails } from '../../../_components/DockerObjectDetails';

export default function Page() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useRouteParams();
  const queryKey = useMemo(
    () => ['docker', environmentId, 'secrets', params.id] as const,
    [environmentId, params.id]
  );
  const secretQuery = useQuery(
    queryKey,
    async () => new SecretViewModel(await getSecret(environmentId, params.id)),
    withError('Unable to retrieve secret')
  );
  const removeSecretMutation = useMutation(
    () => removeSecret(environmentId, params.id),
    withError('Unable to remove secret')
  );
  const handleAccessUpdate = useCallback(
    () => queryClient.invalidateQueries(queryKey),
    [queryClient, queryKey]
  );
  const secret = secretQuery.data;

  if (!secret) return null;

  return (
    <>
      <PageHeader
        title="Secret details"
        breadcrumbs={[
          { label: 'Secrets', link: '/:endpointId/docker/secrets' },
          params.id,
        ]}
        reload
      />
      <>
        <DockerObjectDetails
          icon={Lock}
          title="Secret details"
          name={secret.Name}
          id={secret.Id}
          createdAt={secret.CreatedAt}
          updatedAt={secret.UpdatedAt}
          labels={secret.Labels}
          dataCy="secretDetails-detailsTable"
          actions={
            <span className="ml-2">
              <Authorized authorizations="DockerSecretDelete">
                <DeleteButton
                  data-cy="secretDetails-deleteSecret"
                  size="xsmall"
                  onConfirmed={() =>
                    removeSecretMutation.mutate(undefined, {
                      onSuccess: () => {
                        notifySuccess(
                          'Secret successfully removed',
                          secret.Name
                        );
                        router.push(`/${environmentId}/docker/secrets`);
                      },
                    })
                  }
                  confirmMessage="Do you want to delete this secret?"
                >
                  Delete this secret
                </DeleteButton>
              </Authorized>
            </span>
          }
        />
        <AccessControlPanel
          resourceId={secret.Id}
          resourceControl={secret.ResourceControl}
          resourceType={ResourceControlType.Secret}
          environmentId={environmentId}
          onUpdateSuccess={handleAccessUpdate}
        />
      </>
    </>
  );
}
